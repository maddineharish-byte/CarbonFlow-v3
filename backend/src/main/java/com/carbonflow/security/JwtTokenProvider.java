package com.carbonflow.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${jwt.secret:}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs) {
        if (secret == null || secret.trim().isEmpty()) {
            boolean isProd = System.getenv("RENDER") != null ||
                    "prod".equalsIgnoreCase(System.getProperty("spring.profiles.active")) ||
                    "production".equalsIgnoreCase(System.getenv("NODE_ENV"));
            if (isProd) {
                throw new IllegalStateException("FATAL: Required environment variable JWT_SECRET is not configured for production environment.");
            }
            log.warn("JWT_SECRET is not configured. Generating a secure random in-memory ephemeral HMAC-SHA256 key for development/test.");
            this.key = Jwts.SIG.HS256.key().build();
        } else {
            byte[] keyBytes = secret.trim().getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
                this.key = Keys.hmacShaKeyFor(padded);
            } else {
                this.key = Keys.hmacShaKeyFor(keyBytes);
            }
        }
        this.expirationMs = expirationMs;
    }

    public String generateToken(String userId, String email, String fullName, String organizationId, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("fullName", fullName);
        claims.put("organizationId", organizationId);
        claims.put("role", role);

        return Jwts.builder()
                .subject(userId)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
