package com.carbonflow.security;

import com.carbonflow.common.TenantContext;
import com.carbonflow.user.UserRepository;
import com.carbonflow.user.UserRole;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Multi-provider Authentication Filter supporting:
 * 1. Firebase Authentication ID Tokens (Google Sign-In) cryptographically verified via FirebaseTokenVerifier.
 * 2. Enterprise HMAC JWT tokens issued via AuthController.
 * 
 * Enforces:
 * - Cryptographic verification of token signature and expiration.
 * - Non-empty verified subject (UID / userId).
 * - Multi-tenant isolation by populating TenantContext with verified organizationId.
 * - Role-based authorization mapping.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final UserRepository userRepository;
    private final com.carbonflow.organization.OrganizationRepository organizationRepository;

    public JwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            FirebaseTokenVerifier firebaseTokenVerifier,
            UserRepository userRepository) {
        this(tokenProvider, firebaseTokenVerifier, userRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public JwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            FirebaseTokenVerifier firebaseTokenVerifier,
            UserRepository userRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.carbonflow.organization.OrganizationRepository organizationRepository) {
        this.tokenProvider = tokenProvider;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Permit browser CORS preflight requests without authentication or token checks
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = getJwtFromRequest(request);

            if (StringUtils.hasText(token)) {
                // Provider 1: Firebase ID Token (Google Sign-In)
                if (firebaseTokenVerifier.isFirebaseToken(token)) {
                    processFirebaseToken(token, request);
                }
                // Provider 2: Standard HMAC JJWT token (AuthController / tests / local fallback)
                else if (tokenProvider.validateToken(token)) {
                    processHmacToken(token, request);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context: {}", ex.getMessage());
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void processFirebaseToken(String token, HttpServletRequest request) {
        FirebaseTokenVerifier.VerifiedFirebaseUser verified = firebaseTokenVerifier.verifyToken(token);

        String email = verified.email() != null ? verified.email().toLowerCase().trim() : "";
        String userId = verified.uid();
        String organizationId = "org-" + userId;
        UserRole role = UserRole.COMPANY_ADMIN;
        String fullName = verified.name() != null && !verified.name().isBlank()
                ? verified.name()
                : (email.contains("@") ? email.split("@")[0] : "Google User");

        // Lookup user in relational database
        if (!email.isBlank()) {
            Optional<UserRepository.UserAuthRecord> authRecordOpt = userRepository.findAuthRecordByEmail(email);
            if (authRecordOpt.isPresent()) {
                UserRepository.UserAuthRecord rec = authRecordOpt.get();
                userId = rec.id();
                organizationId = rec.organizationId();
                role = rec.role();
                if (rec.fullName() != null && !rec.fullName().isBlank()) {
                    fullName = rec.fullName();
                }
            } else {
                // Auto-provision an isolated tenant organization for new verified user
                String userOrgId = "org-" + userId;
                role = UserRole.COMPANY_ADMIN;
                organizationId = userOrgId;

                try {
                    if (organizationRepository != null && organizationRepository.findById(userOrgId).isEmpty()) {
                        organizationRepository.create(new com.carbonflow.organization.OrganizationDto(
                                userOrgId,
                                fullName + " Organization",
                                "Technology & Enterprise Software",
                                "Global",
                                "Corporate Headquarters",
                                "Dedicated isolated enterprise carbon accounting organization.",
                                "2025",
                                java.time.LocalDateTime.now(),
                                java.time.LocalDateTime.now()
                        ));
                    }
                    if (userRepository.findById(userId).isEmpty()) {
                        userRepository.createUser(userId, email, "", fullName, "Chief Sustainability Officer", "");
                        userRepository.addMember(userOrgId, userId, role);
                        log.info("Auto-provisioned isolated organization '{}' for verified user '{}' ({})", userOrgId, userId, email);
                    }
                } catch (Exception ex) {
                    log.debug("User/org already provisioned or handled: {}", ex.getMessage());
                }
            }
        }

        TenantContext.setOrganizationId(organizationId);

        UserPrincipal principal = new UserPrincipal(
                userId,
                email.isBlank() ? verified.uid() : email,
                "", // Password omitted
                fullName,
                organizationId,
                role,
                true
        );

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.debug("Authenticated Firebase user '{}' in org '{}' with role '{}'", userId, organizationId, role);
    }

    private void processHmacToken(String jwt, HttpServletRequest request) {
        Claims claims = tokenProvider.parseToken(jwt);
        String userId = claims.get("userId", String.class);
        String email = claims.get("email", String.class);
        String fullName = claims.get("fullName", String.class);
        String organizationId = claims.get("organizationId", String.class);
        String roleStr = claims.get("role", String.class);

        UserRole role = UserRole.valueOf(roleStr);

        TenantContext.setOrganizationId(organizationId);

        UserPrincipal principal = new UserPrincipal(
                userId,
                email,
                "", // Password hash omitted in security context
                fullName,
                organizationId,
                role,
                true
        );

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim();
        }
        return null;
    }
}
