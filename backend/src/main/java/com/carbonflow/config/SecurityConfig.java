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

    @Value("${cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173}")
    private String allowedOrigins;

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
     * CORS configuration bean allowing web client communication with full HTTP verb support.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        configuration.setAllowedOrigins(origins);
        // Support dynamic preview domains on Netlify and cloud containers
        configuration.setAllowedOriginPatterns(List.of(
                "https://*.netlify.app",
                "https://*.onrender.com",
                "https://*.run.app",
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
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
                .requestMatchers("/", "/health", "/api/health", "/api/health/**", "/actuator/**", "/error").permitAll()
                
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
