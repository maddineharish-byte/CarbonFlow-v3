package com.carbonflow.security;

import com.carbonflow.common.TenantContext;
import com.carbonflow.config.SecurityConfig;
import com.carbonflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsFilter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Production CORS and Security Verification Test Suite:
 * 1. OPTIONS preflight for /api/carbon-data from permitted origin (https://carbonflow.ai.studio)
 *    returns HTTP 200 OK and appropriate CORS headers.
 * 2. Preflight response permits requested GET method and Authorization header.
 * 3. Preflight request from an unapproved origin is rejected (HTTP 403 / no Access-Control-Allow-Origin).
 * 4. Unauthenticated actual GET request to /api/carbon-data remains protected (no identity set).
 * 5. Preflight OPTIONS request passes through JwtAuthenticationFilter without requiring token.
 * 6. Dynamic AI Studio preview subdomain is permitted by pattern.
 */
class CorsPreflightSecurityTest {

    private SecurityConfig securityConfig;
    private CorsConfigurationSource corsConfigurationSource;
    private CorsFilter corsFilter;

    private JwtAuthenticationFilter jwtAuthenticationFilter;
    private JwtTokenProvider jwtTokenProvider;
    private FirebaseTokenVerifier firebaseTokenVerifier;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();

        jwtTokenProvider = mock(JwtTokenProvider.class);
        firebaseTokenVerifier = mock(FirebaseTokenVerifier.class);
        userRepository = mock(UserRepository.class);

        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtTokenProvider, firebaseTokenVerifier, userRepository);

        securityConfig = new SecurityConfig(jwtAuthenticationFilter);
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", "https://carbonflow.ai.studio,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173");
        ReflectionTestUtils.setField(securityConfig, "allowedOriginPatterns", "https://*.ai.studio,https://*.netlify.app,https://*.onrender.com,https://*.run.app,http://localhost:*,http://127.0.0.1:*");

        corsConfigurationSource = securityConfig.corsConfigurationSource();
        corsFilter = new CorsFilter(corsConfigurationSource);
    }

    @Test
    @DisplayName("1. OPTIONS preflight for /api/carbon-data from https://carbonflow.ai.studio returns HTTP 200 and CORS headers")
    void testPreflightAllowedOriginReturns200AndHeaders() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/carbon-data");
        request.setParameter("period", "ALL");
        request.setParameter("scope", "ALL");
        request.setParameter("status", "ALL");
        request.setParameter("query", "");

        request.addHeader("Origin", "https://carbonflow.ai.studio");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "authorization,content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus(), "Preflight request from allowed origin must return HTTP 200");
        assertEquals("https://carbonflow.ai.studio", response.getHeader("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Origin header must match permitted frontend origin");
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"),
                "Access-Control-Allow-Credentials must be true");
    }

    @Test
    @DisplayName("2. Preflight response permits requested GET method and Authorization header")
    void testPreflightPermitsRequestedMethodAndHeaders() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/carbon-data");
        request.addHeader("Origin", "https://carbonflow.ai.studio");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "authorization,content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        String allowedMethods = response.getHeader("Access-Control-Allow-Methods");
        assertNotNull(allowedMethods, "Access-Control-Allow-Methods header must be present");
        assertTrue(allowedMethods.contains("GET"), "Allowed methods must include GET");
        assertTrue(allowedMethods.contains("OPTIONS"), "Allowed methods must include OPTIONS");

        String allowedHeaders = response.getHeader("Access-Control-Allow-Headers");
        assertNotNull(allowedHeaders, "Access-Control-Allow-Headers header must be present");
        assertTrue(allowedHeaders.toLowerCase().contains("authorization"), "Allowed headers must include Authorization");
        assertTrue(allowedHeaders.toLowerCase().contains("content-type"), "Allowed headers must include Content-Type");
    }

    @Test
    @DisplayName("3. Requests from an unapproved origin are not granted CORS access")
    void testPreflightUnapprovedOriginRejected() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/carbon-data");
        request.addHeader("Origin", "https://malicious-attacker-unapproved.com");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "authorization,content-type");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        // Spring's DefaultCorsProcessor sets 403 Forbidden and writes "Invalid CORS request"
        assertEquals(403, response.getStatus(), "Preflight from unapproved origin must be rejected with 403 Forbidden");
        assertNull(response.getHeader("Access-Control-Allow-Origin"),
                "Unapproved origin must not receive Access-Control-Allow-Origin header");
    }

    @Test
    @DisplayName("4. Unauthenticated actual GET request to /api/carbon-data remains protected")
    void testUnauthenticatedActualGetToProtectedEndpointRemainsProtected() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/carbon-data");
        request.addHeader("Origin", "https://carbonflow.ai.studio");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        // 1. Process through CORS filter (CORS allows the origin on GET)
        corsFilter.doFilter(request, response, chain);
        assertEquals("https://carbonflow.ai.studio", response.getHeader("Access-Control-Allow-Origin"));

        // 2. Process through JwtAuthenticationFilter without Authorization header
        jwtAuthenticationFilter.doFilter(request, response, chain);

        // Security context must remain unauthenticated
        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "Unauthenticated request must not establish an authenticated security context");
        assertNull(TenantContext.getOrganizationId(),
                "Tenant context must remain empty for unauthenticated requests");
    }

    @Test
    @DisplayName("5. Preflight OPTIONS request passes through JwtAuthenticationFilter without requiring token")
    void testPreflightBypassesJwtAuthenticationFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/carbon-data");
        request.addHeader("Origin", "https://carbonflow.ai.studio");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        jwtAuthenticationFilter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "OPTIONS preflight must not set any security context");
        verifyNoInteractions(jwtTokenProvider);
        verifyNoInteractions(firebaseTokenVerifier);
    }

    @Test
    @DisplayName("6. Dynamic AI Studio preview subdomain is permitted by pattern")
    void testDynamicAiStudioPreviewSubdomainPermitted() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/carbon-data");
        request.addHeader("Origin", "https://preview-abc123xyz.ai.studio");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "authorization");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        corsFilter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus(), "AI Studio preview subdomain must return 200 OK");
        assertEquals("https://preview-abc123xyz.ai.studio", response.getHeader("Access-Control-Allow-Origin"));
    }
}
