package com.carbonflow.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Initializes the Firebase Admin SDK for CarbonFlow.
 * Supports:
 * 1. Explicit Service Account JSON string (FIREBASE_CREDENTIALS_JSON env var)
 * 2. Explicit Service Account file path (FIREBASE_CREDENTIALS_PATH env var)
 * 3. Google Cloud Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS / GCP runtime)
 * 4. Graceful initialization with Project ID for Google Public Token Verification
 */
@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.project-id:auspicious-compass-tcb1c}")
    private String projectId;

    @Value("${firebase.database-id:ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d}")
    private String databaseId;

    @Value("${firebase.credentials-json:}")
    private String credentialsJson;

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (!FirebaseApp.getApps().isEmpty()) {
            this.initialized = true;
            log.info("Firebase Admin SDK already initialized.");
            return;
        }

        try {
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                    .setProjectId(projectId);

            GoogleCredentials credentials = null;

            if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
                log.info("Initializing Firebase Admin SDK using provided FIREBASE_CREDENTIALS_JSON for project '{}'", projectId);
                try (InputStream is = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))) {
                    credentials = GoogleCredentials.fromStream(is);
                }
            } else if (credentialsPath != null && !credentialsPath.trim().isEmpty()) {
                File file = new File(credentialsPath.trim());
                if (file.exists() && file.canRead()) {
                    log.info("Initializing Firebase Admin SDK using credentials file at '{}' for project '{}'", credentialsPath, projectId);
                    try (InputStream is = new FileInputStream(file)) {
                        credentials = GoogleCredentials.fromStream(is);
                    }
                } else {
                    log.warn("Configured FIREBASE_CREDENTIALS_PATH '{}' does not exist or is not readable.", credentialsPath);
                }
            }

            if (credentials == null) {
                // Try Application Default Credentials (ADC)
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                    log.info("Initializing Firebase Admin SDK using Google Application Default Credentials for project '{}'", projectId);
                } catch (Exception e) {
                    log.info("Google Application Default Credentials not present in current runtime. Firebase ID token verification will use Google Public Key JWK verification: {}", e.getMessage());
                }
            }

            if (credentials != null) {
                optionsBuilder.setCredentials(credentials);
                FirebaseApp.initializeApp(optionsBuilder.build());
                this.initialized = true;
                log.info("Firebase Admin SDK initialized successfully for project '{}' (Firestore database: '{}')", projectId, databaseId);
            } else {
                log.info("Firebase Admin SDK will operate with Google Public Key cryptographic verification for project '{}'", projectId);
            }
        } catch (Exception e) {
            log.warn("Notice during Firebase Admin SDK initialization: {}. Falling back to Google Public Key signature verification.", e.getMessage());
        }
    }

    public boolean isInitialized() {
        return initialized && !FirebaseApp.getApps().isEmpty();
    }

    public String getProjectId() {
        return projectId;
    }

    public String getDatabaseId() {
        return databaseId;
    }
}
