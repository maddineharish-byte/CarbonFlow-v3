package com.carbonflow.common;

import com.carbonflow.firestore.FirestoreService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Public Root and Health Check Controller.
 * Provides service metadata at root "/" and health diagnostics at "/health", "/api/health", and "/api/health/firestore".
 */
@RestController
public class HealthController {

    private final FirestoreService firestoreService;

    @Value("${firebase.project-id:auspicious-compass-tcb1c}")
    private String firebaseProjectId;

    @Value("${firebase.database-id:ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d}")
    private String firestoreDatabaseId;

    public HealthController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping({"", "/", "/health"})
    public ApiResponse<Map<String, Object>> rootHealth() {
        return ApiResponse.ok("CarbonFlow Enterprise Platform API", Map.of(
                "status", "UP",
                "service", "CarbonFlow Backend API",
                "version", "1.0.0",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/api/health")
    public ApiResponse<Map<String, Object>> apiHealth() {
        return ApiResponse.ok("Operation successful", Map.of(
                "architecture", "React + Spring Boot + Spring JDBC + SQL Database",
                "version", "1.0.0",
                "service", "CarbonFlow Backend API",
                "javaVersion", System.getProperty("java.version", "21"),
                "timestamp", Instant.now().toString(),
                "status", "UP"
        ));
    }

    @GetMapping("/api/health/firestore")
    public ApiResponse<Map<String, Object>> firestoreHealth() {
        return ApiResponse.ok("Firestore Connectivity Status", firestoreService.testConnectivity());
    }
}
