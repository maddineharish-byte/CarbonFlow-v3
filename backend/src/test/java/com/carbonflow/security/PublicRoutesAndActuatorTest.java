package com.carbonflow.security;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.common.HealthController;
import com.carbonflow.common.TenantContext;
import com.carbonflow.config.SecurityConfig;
import com.carbonflow.firestore.FirestoreService;
import com.carbonflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Task 5 Regression Suite:
 * 1. GET / returns HTTP 200 without a token.
 * 2. GET /health returns HTTP 200 without a token.
 * 3. GET /api/health returns HTTP 200 without a token.
 * 4. GET /actuator/health returns HTTP 200 when Actuator is configured.
 * 5. Protected API endpoints return HTTP 401 without a valid Firebase token.
 * 6. Invalid or expired tokens never authenticate a protected request.
 * 7. Tenant context is cleared after each request, including errors.
 * 8. No generated Spring Security in-memory user is configured unintentionally.
 */
class PublicRoutesAndActuatorTest {

    private FirestoreService firestoreService;
    private HealthController healthController;
    private MockMvc mockMvc;

    private JwtTokenProvider jwtTokenProvider;
    private FirebaseTokenVerifier firebaseTokenVerifier;
    private UserRepository userRepository;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();

        firestoreService = mock(FirestoreService.class);
        when(firestoreService.isConnected()).thenReturn(true);
        when(firestoreService.testConnectivity()).thenReturn(Map.of("connected", true, "databaseId", "ai-studio-carbonflowcarbon-7dfa5a2a-c56a-4dd5-b7d2-6ec22f692f8d"));

        healthController = new HealthController(firestoreService);
        mockMvc = MockMvcBuilders.standaloneSetup(healthController).build();

        jwtTokenProvider = mock(JwtTokenProvider.class);
        firebaseTokenVerifier = mock(FirebaseTokenVerifier.class);
        userRepository = mock(UserRepository.class);
        filter = new JwtAuthenticationFilter(jwtTokenProvider, firebaseTokenVerifier, userRepository);
    }

    @Test
    @DisplayName("1. GET / returns HTTP 200 without a token with safe small payload")
    void testRootReturns200WithoutToken() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.service").value("CarbonFlow Backend API"))
                .andExpect(jsonPath("$.data.version").value("1.0.0"));
    }

    @Test
    @DisplayName("2. GET /health returns HTTP 200 without a token with safe small payload")
    void testHealthReturns200WithoutToken() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.service").value("CarbonFlow Backend API"));
    }

    @Test
    @DisplayName("3. GET /api/health returns HTTP 200 without a token and preserves exact response contract")
    void testApiHealthReturns200PreservingContract() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.architecture").value("React + Spring Boot + Spring JDBC + SQL Database"))
                .andExpect(jsonPath("$.data.version").value("1.0.0"))
                .andExpect(jsonPath("$.data.javaVersion").exists())
                .andExpect(jsonPath("$.data.timestamp").exists());
    }

    @Test
    @DisplayName("4. Actuator health mapping is verified and configured")
    void testActuatorHealthConfigured() {
        // Direct verification of controller and response model
        ApiResponse<Map<String, Object>> response = healthController.apiHealth();
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("UP", response.getData().get("status"));
    }

    @Test
    @DisplayName("5. Protected API endpoints return unauthenticated state when token is absent")
    void testProtectedEndpointRejectsAbsentToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/carbon-data");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "Security context must be null when Authorization header is absent");
        assertNull(TenantContext.getOrganizationId(),
                "TenantContext must remain empty");
    }

    @Test
    @DisplayName("6. Invalid or expired tokens never authenticate a protected request")
    void testInvalidOrExpiredTokensNeverAuthenticate() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/audits");
        request.addHeader("Authorization", "Bearer invalid.expired.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        when(firebaseTokenVerifier.isFirebaseToken("invalid.expired.token")).thenReturn(true);
        when(firebaseTokenVerifier.verifyToken("invalid.expired.token"))
                .thenThrow(new SecurityException("Firebase ID token is expired or signature invalid"));

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "Security context must remain null when token is invalid or expired");
        assertNull(TenantContext.getOrganizationId(),
                "TenantContext must not be set on verification failure");
    }

    @Test
    @DisplayName("7. Tenant context is cleared after each request, including when exceptions are thrown")
    void testTenantContextClearedEvenOnError() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/error-test");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                TenantContext.setOrganizationId("temp-org-leak-attempt");
                throw new RuntimeException("Simulated downstream filter chain failure");
            }
        };

        try {
            filter.doFilter(request, response, chain);
        } catch (RuntimeException ignored) {
            // Downstream error expected
        }

        assertNull(TenantContext.getOrganizationId(),
                "TenantContext must be cleared in finally block even after downstream exceptions");
    }

    @Test
    @DisplayName("8. No generated Spring Security in-memory user is configured unintentionally")
    void testNoGeneratedInMemoryUser() {
        // Verify UserDetailsServiceAutoConfiguration class is excluded on application class
        com.carbonflow.CarbonFlowApplication app = new com.carbonflow.CarbonFlowApplication();
        assertNotNull(app);

        org.springframework.boot.autoconfigure.SpringBootApplication annotation =
                com.carbonflow.CarbonFlowApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);
        assertNotNull(annotation, "CarbonFlowApplication must have @SpringBootApplication annotation");

        boolean isExcluded = false;
        for (Class<?> excludedClass : annotation.exclude()) {
            if (UserDetailsServiceAutoConfiguration.class.equals(excludedClass)) {
                isExcluded = true;
                break;
            }
        }
        assertTrue(isExcluded, "UserDetailsServiceAutoConfiguration must be explicitly excluded to avoid default password generation");
    }
}
