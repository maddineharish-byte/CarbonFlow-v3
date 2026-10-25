package com.carbonflow.config;

import com.carbonflow.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security configuration establishing:
 * 1. Stateless session management and Bearer JWT filter integration.
 * 2. Cross-Origin Resource Sharing (CORS) rules tailored for frontend integration.
 * 3. BCrypt-based cryptographic password hashing.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${cors.allowed-origins:https://carbonflow.ai.studio,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Value("${cors.allowed-origin-patterns:https://*.ai.studio,https://*.netlify.app,https://*.onrender.com,https://*.run.app,http://localhost:*,http://127.0.0.1:*}")
    private String allowedOriginPatterns;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * Password encoder utilizing BCrypt adaptive salted hashing.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Explicit CORS configuration source bean establishing:
     * 1. Exact production frontend origin https://carbonflow.ai.studio.
     * 2. Configurable origins via cors.allowed-origins.
     * 3. Flexible preview patterns (*.ai.studio, *.netlify.app, *.onrender.com, *.run.app, localhost).
     * 4. Full HTTP verb support (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD).
     * 5. Preflight header validation for Authorization, Content-Type, Accept, and Origin.
     * 6. Credentials support and 1-hour preflight cache.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Explicitly permit the exact production frontend origin
        java.util.List<String> origins = new java.util.ArrayList<>();
        origins.add("https://carbonflow.ai.studio");

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && !origins.contains(s))
                    .forEach(origins::add);
        }
        configuration.setAllowedOrigins(origins);

        // 2. Support dynamic preview domains on AI Studio, Netlify, and cloud containers
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
        configuration.setAllowedOriginPatterns(patterns);

        // 3. Permitted HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));

        // 4. Permitted request headers
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        // 5. Exposed response headers
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));

        // 6. Support credentials and 1-hour preflight caching
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Security filter chain defining HTTP authorization rules, stateless session management,
     * and JWT / Firebase authentication filter injection.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF since the API is stateless and communicates via Authorization headers
            .csrf(AbstractHttpConfigurer::disable)
            
            // Apply CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Enforce stateless session policy (no HTTP session cookies)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Custom exception handling for authentication and access failures
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("""
                        {"success":false,"message":"Unauthorized: Authentication token is missing, invalid, or expired.","code":"UNAUTHORIZED"}
                        """);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("""
                        {"success":false,"message":"Forbidden: You do not have permission to access this resource.","code":"FORBIDDEN"}
                        """);
                })
            )
            
            // URL Authorization Rules
            .authorizeHttpRequests(auth -> auth
                // Allow browser preflight OPTIONS requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Public root, health check, and diagnostic endpoints
                .requestMatchers("/", "/health", "/health/**", "/api/health", "/api/health/**", "/error").permitAll()
                .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                
                // Public authentication and onboarding endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                
                // Public maps, emission factors, and geocoding services
                .requestMatchers("/api/maps/**").permitAll()
                .requestMatchers("/api/carbon-data/emission-factors").permitAll()
                .requestMatchers("/api/travel/route", "/api/travel/geocode", "/api/travel/reverse-geocode").permitAll()
                
                // Public AI Assistant Chatbot endpoint
                .requestMatchers("/api/gemini/**").permitAll()
                
                // All other enterprise business, audit, and compliance endpoints require valid JWT / Firebase token
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            
            // Register JWT token inspection prior to UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
