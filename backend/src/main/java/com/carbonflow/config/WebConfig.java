package com.carbonflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:https://carbonflow.ai.studio,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Value("${cors.allowed-origin-patterns:https://*.ai.studio,https://*.netlify.app,https://*.onrender.com,https://*.run.app,http://localhost:*,http://127.0.0.1:*}")
    private String allowedOriginPatterns;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        java.util.List<String> origins = new java.util.ArrayList<>();
        origins.add("https://carbonflow.ai.studio");

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && !origins.contains(s))
                    .forEach(origins::add);
        }

        java.util.List<String> patterns = new java.util.ArrayList<>();
        patterns.add("https://*.ai.studio");
        patterns.add("https://*.netlify.app");
        patterns.add("https://*.onrender.com");
        patterns.add("https://*.run.app");
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");

        if (allowedOriginPatterns != null && !allowedOriginPatterns.isBlank()) {
            Arrays.stream(allowedOriginPatterns.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && !patterns.contains(s))
                    .forEach(patterns::add);
        }

        registry.addMapping("/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedOriginPatterns(patterns.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "Access-Control-Request-Method", "Access-Control-Request-Headers")
                .exposedHeaders("Authorization", "Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
