package com.carbonflow.security;

import com.carbonflow.config.FirebaseConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.PublicKey;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Firebase ID Token cryptographic verifier.
 * 
 * Verifies tokens:
 * 1. Via FirebaseAuth.getInstance().verifyIdToken() if Firebase Admin SDK is initialized with credentials.
 * 2. Via Google's official public x509 certificates (RS256) cached dynamically from Google's Secure Token endpoint.
 * 
 * Validates:
 * - RS256 cryptographic signature against Google's public key for the matching 'kid'
 * - 'iss' matches https://securetoken.google.com/<projectId>
 * - 'aud' matches <projectId>
 * - 'exp' has not expired (with 30s clock skew allowance)
 * - 'sub' (the verified Firebase UID) is non-empty
 */
@Component
public class FirebaseTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(FirebaseTokenVerifier.class);
    private static final String GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

    private final FirebaseConfig firebaseConfig;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${firebase.project-id:auspicious-compass-tcb1c}")
    private String projectId;

    // Cache for Google's public X509 certificates: keyId -> X509Certificate
    private final Map<String, X509Certificate> certCache = new ConcurrentHashMap<>();
    private Instant certsCacheExpiry = Instant.MIN;

    public record VerifiedFirebaseUser(
            String uid,
            String email,
            String name,
            boolean emailVerified,
            Map<String, Object> claims
    ) {}

    public FirebaseTokenVerifier(FirebaseConfig firebaseConfig, ObjectMapper objectMapper) {
        this.firebaseConfig = firebaseConfig;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /**
     * Checks if a token appears to be a Firebase/Google ID token.
     */
    public boolean isFirebaseToken(String token) {
        if (token == null || !token.contains(".")) {
            return false;
        }
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;

            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(payloadBytes);
            String iss = payload.path("iss").asText("");
            return iss.startsWith("https://securetoken.google.com/");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Cryptographically verifies the Firebase ID token and returns verified identity.
     * Throws SecurityException if verification fails.
     */
    public VerifiedFirebaseUser verifyToken(String token) {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Authentication token is missing or empty.");
        }

        // 1. Try Firebase Admin SDK if fully initialized
        if (firebaseConfig.isInitialized()) {
            try {
                FirebaseToken fbToken = FirebaseAuth.getInstance().verifyIdToken(token);
                log.debug("Verified token using Firebase Admin SDK for UID: {}", fbToken.getUid());
                return new VerifiedFirebaseUser(
                        fbToken.getUid(),
                        fbToken.getEmail(),
                        fbToken.getName(),
                        fbToken.isEmailVerified(),
                        fbToken.getClaims()
                );
            } catch (Exception e) {
                log.debug("Firebase Admin SDK verification attempt failed ({}); checking Google Public Key JWK...", e.getMessage());
            }
        }

        // 2. Cryptographic verification using Google Public X509 Certificates (RS256)
        return verifyViaGooglePublicKeys(token);
    }

    private VerifiedFirebaseUser verifyViaGooglePublicKeys(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new SecurityException("Malformed JWT token structure.");
            }

            // Decode header
            byte[] headerBytes = Base64.getUrlDecoder().decode(parts[0]);
            JsonNode header = objectMapper.readTree(headerBytes);
            String alg = header.path("alg").asText("");
            String kid = header.path("kid").asText("");

            if (!"RS256".equals(alg)) {
                throw new SecurityException("Unsupported token signing algorithm: " + alg + ". Expected RS256.");
            }
            if (kid.isBlank()) {
                throw new SecurityException("Missing 'kid' in token header.");
            }

            // Decode payload
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(payloadBytes);

            // Validate claims
            String iss = payload.path("iss").asText("");
            String expectedIss = "https://securetoken.google.com/" + projectId;
            if (!expectedIss.equals(iss)) {
                throw new SecurityException("Invalid token issuer: '" + iss + "'. Expected '" + expectedIss + "'.");
            }

            String aud = payload.path("aud").asText("");
            if (!projectId.equals(aud)) {
                throw new SecurityException("Invalid token audience: '" + aud + "'. Expected '" + projectId + "'.");
            }

            long exp = payload.path("exp").asLong(0);
            long nowSec = Instant.now().getEpochSecond();
            if (exp < (nowSec - 30)) { // 30-second clock skew
                throw new SecurityException("Firebase ID token has expired at " + Instant.ofEpochSecond(exp));
            }

            String sub = payload.path("sub").asText("");
            if (sub.isBlank()) {
                throw new SecurityException("Missing subject (UID) in Firebase ID token.");
            }

            // Verify signature using Google's public certificate
            X509Certificate certificate = getGoogleCertificate(kid);
            if (certificate == null) {
                throw new SecurityException("Google public certificate not found for key ID: " + kid);
            }

            byte[] signatureBytes = Base64.getUrlDecoder().decode(parts[2]);
            byte[] signedContent = (parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII);

            PublicKey publicKey = certificate.getPublicKey();
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(publicKey);
            signature.update(signedContent);

            if (!signature.verify(signatureBytes)) {
                throw new SecurityException("Cryptographic RS256 signature verification failed for Firebase ID token.");
            }

            String email = payload.path("email").asText(null);
            String name = payload.path("name").asText(null);
            boolean emailVerified = payload.path("email_verified").asBoolean(false);

            Map<String, Object> claims = Collections.emptyMap();
            try {
                claims = objectMapper.convertValue(payload, new TypeReference<Map<String, Object>>() {});
            } catch (Exception ignored) {}

            log.debug("Successfully verified Firebase ID token for UID '{}' ({}) via Google Public Keys", sub, email);

            return new VerifiedFirebaseUser(
                    sub,
                    email,
                    name,
                    emailVerified,
                    claims
            );
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            throw new SecurityException("Failed to cryptographically verify Firebase ID token: " + e.getMessage(), e);
        }
    }

    private synchronized X509Certificate getGoogleCertificate(String kid) {
        if (Instant.now().isBefore(certsCacheExpiry) && certCache.containsKey(kid)) {
            return certCache.get(kid);
        }

        refreshGoogleCertificates();
        return certCache.get(kid);
    }

    private void refreshGoogleCertificates() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_CERTS_URL))
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                log.warn("Failed to fetch Google public certificates, HTTP status: {}", resp.statusCode());
                return;
            }

            JsonNode certsNode = objectMapper.readTree(resp.body());
            CertificateFactory factory = CertificateFactory.getInstance("X.509");

            certsNode.fields().forEachRemaining(entry -> {
                String keyId = entry.getKey();
                String certPem = entry.getValue().asText();
                try (ByteArrayInputStream in = new ByteArrayInputStream(certPem.getBytes(StandardCharsets.UTF_8))) {
                    X509Certificate cert = (X509Certificate) factory.generateCertificate(in);
                    certCache.put(keyId, cert);
                } catch (Exception e) {
                    log.warn("Failed to parse X509 certificate for kid {}: {}", keyId, e.getMessage());
                }
            });

            // Cache for 6 hours
            this.certsCacheExpiry = Instant.now().plus(Duration.ofHours(6));
            log.info("Refreshed Google public certificates cache. Loaded {} keys.", certCache.size());
        } catch (Exception e) {
            log.error("Error refreshing Google public certificates: {}", e.getMessage(), e);
        }
    }
}
