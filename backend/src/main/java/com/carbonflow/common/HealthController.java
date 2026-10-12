package com.carbonflow.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok(Map.of(
                "status", "UP",
                "service", "CarbonFlow Backend API",
                "version", "1.0.0",
                "javaVersion", System.getProperty("java.version"),
                "architecture", "React + Spring Boot + Spring JDBC + SQL Database",
                "timestamp", Instant.now().toString()
        ));
    }
}
