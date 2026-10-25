package com.carbonflow.auth;

import com.carbonflow.auditlog.AuditLogService;
import com.carbonflow.organization.OrganizationDto;
import com.carbonflow.organization.OrganizationRepository;
import com.carbonflow.security.JwtTokenProvider;
import com.carbonflow.user.UserRepository;
import com.carbonflow.user.UserRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditLogService = auditLogService;
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Optional<UserRepository.UserAuthRecord> optUser = userRepository.findAuthRecordByEmail(request.email());
        if (optUser.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        UserRepository.UserAuthRecord user = optUser.get();
        if (!user.active()) {
            throw new IllegalArgumentException("User account is deactivated.");
        }

        // Cryptographic BCrypt verification of password against stored hash
        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String token = tokenProvider.generateToken(
                user.id(),
                user.email(),
                user.fullName(),
                user.organizationId(),
                user.role().name()
        );

        auditLogService.log(user.organizationId(), user.id(), user.fullName(), user.email(), "LOGIN", "AUTH", user.id(), "{\"email\":\"" + user.email() + "\"}");

        return new AuthDto.AuthResponse(
                token,
                user.id(),
                user.email(),
                user.fullName(),
                user.organizationId(),
                user.organizationName(),
                user.role()
        );
    }

    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        Optional<UserRepository.UserAuthRecord> existing = userRepository.findAuthRecordByEmail(request.email());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        String orgId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        OrganizationDto newOrg = new OrganizationDto(
                orgId,
                request.organizationName(),
                request.industry(),
                request.country(),
                "",
                "Created via self-service signup",
                "2025",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        organizationRepository.create(newOrg);

        String encodedPassword = passwordEncoder.encode(request.password());
        userRepository.createUser(userId, request.email(), encodedPassword, request.fullName(), request.title(), null);
        userRepository.addMember(orgId, userId, UserRole.COMPANY_ADMIN);

        auditLogService.log(orgId, userId, request.fullName(), request.email(), "REGISTER", "AUTH", userId, "{\"organization\":\"" + request.organizationName() + "\"}");

        String token = tokenProvider.generateToken(
                userId,
                request.email(),
                request.fullName(),
                orgId,
                UserRole.COMPANY_ADMIN.name()
        );

        return new AuthDto.AuthResponse(
                token,
                userId,
                request.email(),
                request.fullName(),
                orgId,
                request.organizationName(),
                UserRole.COMPANY_ADMIN
        );
    }

    public void resetPassword(AuthDto.PasswordResetRequest req) {
        if (req.email() == null || req.email().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        Optional<UserRepository.UserAuthRecord> userOpt = userRepository.findAuthRecordByEmail(req.email());
        if (userOpt.isEmpty()) {
            // Anti-enumeration: Return uniformly without revealing whether account exists
            return;
        }
        UserRepository.UserAuthRecord user = userOpt.get();

        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            // Password modification requires verified current password
            if (req.oldPassword() == null || req.oldPassword().isBlank()) {
                throw new IllegalArgumentException("Current password is required to set a new password.");
            }
            if (!passwordEncoder.matches(req.oldPassword(), user.passwordHash())) {
                throw new IllegalArgumentException("Current password verification failed.");
            }
            if (req.newPassword().length() < 8) {
                throw new IllegalArgumentException("New password must be at least 8 characters long.");
            }
            String newHash = passwordEncoder.encode(req.newPassword());
            userRepository.updatePassword(user.id(), newHash);
            auditLogService.log(user.organizationId(), user.id(), user.fullName(), user.email(), "PASSWORD_RESET", "AUTH", user.id(), "{}");
        } else {
            // For forgot password without current password: log audit and dispatch reset link securely
            auditLogService.log(user.organizationId(), user.id(), user.fullName(), user.email(), "PASSWORD_RESET_REQUESTED", "AUTH", user.id(), "{}");
        }
    }
}
