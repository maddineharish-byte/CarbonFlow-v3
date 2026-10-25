package com.carbonflow.firestore;

import com.carbonflow.config.FirebaseConfig;
import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Enterprise Cloud Firestore service for the Java Spring Boot backend.
 * 
 * CRITICAL CONFIGURATION:
 * Explicitly binds to:
 * - Project ID: auspicious-compass-tcb1c
 * - Database ID: ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d
 * 
 * Never silently defaults to "(default)".
 */
@Service
public class FirestoreService {

    private static final Logger log = LoggerFactory.getLogger(FirestoreService.class);

    private final FirebaseConfig firebaseConfig;

    @Value("${firebase.project-id:auspicious-compass-tcb1c}")
    private String projectId;

    @Value("${firebase.database-id:ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d}")
    private String databaseId;

    @Value("${firebase.credentials-json:}")
    private String credentialsJson;

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    private Firestore firestore;
    private boolean connected = false;

    public FirestoreService(FirebaseConfig firebaseConfig) {
        this.firebaseConfig = firebaseConfig;
    }

    @PostConstruct
    public void init() {
        try {
            FirestoreOptions.Builder builder = FirestoreOptions.newBuilder()
                    .setProjectId(projectId)
                    .setDatabaseId(databaseId);

            GoogleCredentials credentials = null;

            if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
                try (InputStream is = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))) {
                    credentials = GoogleCredentials.fromStream(is);
                }
            } else if (credentialsPath != null && !credentialsPath.trim().isEmpty()) {
                File file = new File(credentialsPath.trim());
                if (file.exists() && file.canRead()) {
                    try (InputStream is = new FileInputStream(file)) {
                        credentials = GoogleCredentials.fromStream(is);
                    }
                }
            }

            if (credentials == null) {
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                } catch (Exception e) {
                    log.info("FirestoreService: Application Default Credentials not present in current runtime. Backend will initialize Firestore on-demand when credentials are provided.");
                }
            }

            if (credentials != null) {
                builder.setCredentials(credentials);
                this.firestore = builder.build().getService();
                this.connected = true;
                log.info("Cloud Firestore initialized explicitly with Project: '{}' and Database ID: '{}'", projectId, databaseId);
            } else {
                log.info("Cloud Firestore configured with Project: '{}' and Database ID: '{}' (awaiting service credentials).", projectId, databaseId);
            }
        } catch (Exception e) {
            log.warn("Cloud Firestore initialization notice for database '{}': {}", databaseId, e.getMessage());
        }
    }

    public boolean isConnected() {
        return connected && firestore != null;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getDatabaseId() {
        return databaseId;
    }

    public Firestore getFirestore() {
        return firestore;
    }

    /**
     * Diagnostic connectivity test with read-only ping against the configured database.
     * Non-destructive: does not mutate or create temporary documents.
     */
    public Map<String, Object> testConnectivity() {
        Map<String, Object> result = new HashMap<>();
        result.put("projectId", projectId);
        result.put("databaseId", databaseId);
        result.put("explicitDatabaseSelection", true);

        if (!isConnected()) {
            result.put("connected", false);
            result.put("status", "UNCONFIGURED_CREDENTIALS");
            result.put("message", "Firestore credentials (FIREBASE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS) not set on backend.");
            return result;
        }

        try {
            // Read-only shallow ping against organizations collection
            QuerySnapshot ping = firestore.collection("organizations").limit(1).get().get(5, TimeUnit.SECONDS);
            boolean reachable = ping != null;

            result.put("connected", true);
            result.put("status", reachable ? "VERIFIED" : "PING_FAILED");
            result.put("liveConnectivityVerified", reachable);
            result.put("timestamp", Instant.now().toString());
            return result;
        } catch (Exception e) {
            log.warn("Firestore connectivity test failed on database '{}': {}", databaseId, e.getMessage());
            result.put("connected", false);
            result.put("status", "FAILED");
            result.put("error", e.getMessage());
            return result;
        }
    }
}
