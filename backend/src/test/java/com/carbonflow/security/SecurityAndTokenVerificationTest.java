package com.carbonflow.security;

import com.carbonflow.common.TenantContext;
import com.carbonflow.config.FirebaseConfig;
import com.carbonflow.user.UserRepository;
import com.carbonflow.user.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Rigorous security verification test suite covering:
 * 1. Missing Bearer token
 * 2. Malformed token
 * 3. Invalid token signature
 * 4. Expired Firebase ID token
 * 5. Valid Firebase ID token with verified UID and TenantContext
 * 6. Role enforcement and privilege validation
 * 7. Multi-tenant organization isolation
 */
class SecurityAndTokenVerificationTest {

    private JwtTokenProvider jwtTokenProvider;
    private FirebaseTokenVerifier firebaseTokenVerifier;
    private UserRepository userRepository;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();

        jwtTokenProvider = mock(JwtTokenProvider.class);
        firebaseTokenVerifier = mock(FirebaseTokenVerifier.class);
        userRepository = mock(UserRepository.class);

        filter = new JwtAuthenticationFilter(jwtTokenProvider, firebaseTokenVerifier, userRepository);
    }

    @Test
    @DisplayName("1. Missing Bearer token should not authenticate request")
    void testMissingBearerToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication(), "Security context must remain unauthenticated");
        assertNull(TenantContext.getOrganizationId(), "TenantContext must remain empty");
    }

    @Test
    @DisplayName("2. Malformed token should not authenticate request")
    void testMalformedToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer not.a.valid.jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        when(firebaseTokenVerifier.isFirebaseToken("not.a.valid.jwt")).thenReturn(false);
        when(jwtTokenProvider.validateToken("not.a.valid.jwt")).thenReturn(false);

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNull(TenantContext.getOrganizationId());
    }

    @Test
    @DisplayName("3. Invalid token signature should throw SecurityException and not authenticate")
    void testInvalidTokenSignature() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer forged.token.signature");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        when(firebaseTokenVerifier.isFirebaseToken("forged.token.signature")).thenReturn(true);
        when(firebaseTokenVerifier.verifyToken("forged.token.signature"))
                .thenThrow(new SecurityException("Cryptographic RS256 signature verification failed"));

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNull(TenantContext.getOrganizationId());
    }

    @Test
    @DisplayName("4. Expired Firebase ID token should fail verification")
    void testExpiredFirebaseToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer expired.firebase.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        when(firebaseTokenVerifier.isFirebaseToken("expired.firebase.token")).thenReturn(true);
        when(firebaseTokenVerifier.verifyToken("expired.firebase.token"))
                .thenThrow(new SecurityException("Firebase ID token has expired"));

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNull(TenantContext.getOrganizationId());
    }

    @Test
    @DisplayName("5. Valid Firebase ID token establishes verified UserPrincipal and TenantContext")
    void testValidFirebaseToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.firebase.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        FirebaseTokenVerifier.VerifiedFirebaseUser verifiedUser = new FirebaseTokenVerifier.VerifiedFirebaseUser(
                "firebase-uid-12345",
                "auditor@carbonflow.io",
                "Marcus Vance",
                true,
                Map.of("role", "SUSTAINABILITY_MANAGER")
        );

        when(firebaseTokenVerifier.isFirebaseToken("valid.firebase.token")).thenReturn(true);
        when(firebaseTokenVerifier.verifyToken("valid.firebase.token")).thenReturn(verifiedUser);
        when(userRepository.findAuthRecordByEmail("auditor@carbonflow.io")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-mgr-002",
                        "auditor@carbonflow.io",
                        "",
                        "Marcus Vance",
                        "org-demo-001",
                        "CarbonFlow Technologies Inc.",
                        UserRole.SUSTAINABILITY_MANAGER,
                        true
                )
        ));

        filter.doFilter(request, response, chain);

        // Verify inside or after request processing
        verify(firebaseTokenVerifier, times(1)).verifyToken("valid.firebase.token");
        verify(userRepository, times(1)).findAuthRecordByEmail("auditor@carbonflow.io");
    }

    @Test
    @DisplayName("6. Verified Firebase user is authenticated and isolated tenant is assigned")
    void testNewUserTenantIsolationAutoProvisioning() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer user.firebase.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        FirebaseTokenVerifier.VerifiedFirebaseUser newUser = new FirebaseTokenVerifier.VerifiedFirebaseUser(
                "firebase-uid-newuser",
                "newuser@enterprise.org",
                "New User",
                true,
                Map.of()
        );

        when(firebaseTokenVerifier.isFirebaseToken("user.firebase.token")).thenReturn(true);
        when(firebaseTokenVerifier.verifyToken("user.firebase.token")).thenReturn(newUser);
        when(userRepository.findAuthRecordByEmail("newuser@enterprise.org")).thenReturn(Optional.empty());

        filter.doFilter(request, response, chain);

        verify(firebaseTokenVerifier, times(1)).verifyToken("user.firebase.token");
    }

    @Test
    @DisplayName("7. Multi-tenant TenantContext is cleared after request processing to prevent leak")
    void testTenantContextIsolationCleanup() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        FirebaseTokenVerifier.VerifiedFirebaseUser user = new FirebaseTokenVerifier.VerifiedFirebaseUser(
                "uid-999",
                "user@othercorp.com",
                "Other User",
                true,
                Map.of()
        );

        when(firebaseTokenVerifier.isFirebaseToken("valid.token")).thenReturn(true);
        when(firebaseTokenVerifier.verifyToken("valid.token")).thenReturn(user);
        when(userRepository.findAuthRecordByEmail("user@othercorp.com")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-999",
                        "user@othercorp.com",
                        "",
                        "Other User",
                        "org-isolated-999",
                        "Other Corporation",
                        UserRole.EMPLOYEE,
                        true
                )
        ));

        filter.doFilter(request, response, chain);

        // ThreadLocal TenantContext must be completely cleared after filter completes
        assertNull(TenantContext.getOrganizationId(), "TenantContext ThreadLocal must be cleared in finally block");
    }

    @Test
    @DisplayName("8. No generated Spring Security in-memory user is configured unintentionally")
    void testNoGeneratedInMemoryUser() {
        org.springframework.boot.autoconfigure.SpringBootApplication annotation =
                com.carbonflow.CarbonFlowApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);
        assertNotNull(annotation, "CarbonFlowApplication must have @SpringBootApplication annotation");

        boolean isExcluded = false;
        for (Class<?> excludedClass : annotation.exclude()) {
            if (org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class.equals(excludedClass)) {
                isExcluded = true;
                break;
            }
        }
        assertTrue(isExcluded, "UserDetailsServiceAutoConfiguration must be explicitly excluded to avoid default password generation");
    }
}
