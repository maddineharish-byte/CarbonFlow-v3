package com.carbonflow.auth;

import com.carbonflow.auditlog.AuditLogService;
import com.carbonflow.organization.OrganizationRepository;
import com.carbonflow.security.JwtTokenProvider;
import com.carbonflow.user.UserRepository;
import com.carbonflow.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Security unit tests for AuthService:
 * 1. Verifies that the legacy "Password123!" master backdoor is permanently eliminated.
 * 2. Verifies that invalid passwords always throw IllegalArgumentException.
 * 3. Verifies that password reset strictly verifies the existing current password.
 * 4. Verifies anti-enumeration protection on password reset.
 */
class AuthServiceSecurityTest {

    private UserRepository userRepository;
    private OrganizationRepository organizationRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider jwtTokenProvider;
    private AuditLogService auditLogService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        organizationRepository = mock(OrganizationRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtTokenProvider = mock(JwtTokenProvider.class);
        auditLogService = mock(AuditLogService.class);

        authService = new AuthService(userRepository, organizationRepository, passwordEncoder, jwtTokenProvider, auditLogService);
    }

    @Test
    @DisplayName("Login strictly enforces BCrypt hash matching and rejects incorrect password")
    void testLoginRejectsIncorrectPassword() {
        String realPassword = "MySecureCustomPassword987!";
        String realHash = passwordEncoder.encode(realPassword);

        when(userRepository.findAuthRecordByEmail("user@example.com")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-1",
                        "user@example.com",
                        realHash,
                        "Real User",
                        "org-1",
                        "Real Org",
                        UserRole.EMPLOYEE,
                        true
                )
        ));

        AuthDto.LoginRequest request = new AuthDto.LoginRequest("user@example.com", "WrongPassword123");
        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Login strictly rejects legacy Password123! backdoor when account has different password")
    void testLoginRejectsLegacyMasterPasswordBackdoor() {
        String realPassword = "DifferentComplexPassword456#";
        String realHash = passwordEncoder.encode(realPassword);

        when(userRepository.findAuthRecordByEmail("victim@carbonflow.io")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-victim",
                        "victim@carbonflow.io",
                        realHash,
                        "Victim User",
                        "org-victim",
                        "Victim Org",
                        UserRole.COMPANY_ADMIN,
                        true
                )
        ));

        // Attempting to log in with previously backdoored "Password123!" must fail
        AuthDto.LoginRequest backdoorAttempt = new AuthDto.LoginRequest("victim@carbonflow.io", "Password123!");
        assertThrows(IllegalArgumentException.class, () -> authService.login(backdoorAttempt),
                "Legacy backdoor Password123! must not bypass real BCrypt password hash");
    }

    @Test
    @DisplayName("Password reset requires old password and rejects mismatched old password")
    void testPasswordResetRejectsMismatchedOldPassword() {
        String currentPassword = "CurrentPassword123!";
        String currentHash = passwordEncoder.encode(currentPassword);

        when(userRepository.findAuthRecordByEmail("user@example.com")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-1",
                        "user@example.com",
                        currentHash,
                        "Test User",
                        "org-1",
                        "Test Org",
                        UserRole.EMPLOYEE,
                        true
                )
        ));

        AuthDto.PasswordResetRequest request = new AuthDto.PasswordResetRequest(
                "user@example.com",
                "WrongCurrentPassword",
                "BrandNewSecurePassword123!"
        );

        assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request),
                "Password reset must fail when old password does not match current hash");
        verify(userRepository, never()).updatePassword(anyString(), anyString());
    }

    @Test
    @DisplayName("Password reset rejects setting new password when old password is null or blank")
    void testPasswordResetRejectsMissingOldPasswordWhenSettingNewPassword() {
        String currentPassword = "CurrentPassword123!";
        String currentHash = passwordEncoder.encode(currentPassword);

        when(userRepository.findAuthRecordByEmail("user@example.com")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-1",
                        "user@example.com",
                        currentHash,
                        "Test User",
                        "org-1",
                        "Test Org",
                        UserRole.EMPLOYEE,
                        true
                )
        ));

        AuthDto.PasswordResetRequest request = new AuthDto.PasswordResetRequest(
                "user@example.com",
                null,
                "BrandNewSecurePassword123!"
        );

        assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(request),
                "Setting a new password must require oldPassword");
        verify(userRepository, never()).updatePassword(anyString(), anyString());
    }

    @Test
    @DisplayName("Password reset succeeds and updates hash when old password is verified")
    void testPasswordResetSucceedsWithVerifiedOldPassword() {
        String currentPassword = "CurrentPassword123!";
        String currentHash = passwordEncoder.encode(currentPassword);

        when(userRepository.findAuthRecordByEmail("user@example.com")).thenReturn(Optional.of(
                new UserRepository.UserAuthRecord(
                        "usr-1",
                        "user@example.com",
                        currentHash,
                        "Test User",
                        "org-1",
                        "Test Org",
                        UserRole.EMPLOYEE,
                        true
                )
        ));

        AuthDto.PasswordResetRequest request = new AuthDto.PasswordResetRequest(
                "user@example.com",
                "CurrentPassword123!",
                "BrandNewSecurePassword123!"
        );

        assertDoesNotThrow(() -> authService.resetPassword(request));
        verify(userRepository, times(1)).updatePassword(eq("usr-1"), anyString());
    }

    @Test
    @DisplayName("Password reset with non-existent user returns quietly without enumeration")
    void testPasswordResetNonExistentUserAntiEnumeration() {
        when(userRepository.findAuthRecordByEmail("unknown@example.com")).thenReturn(Optional.empty());

        AuthDto.PasswordResetRequest request = new AuthDto.PasswordResetRequest(
                "unknown@example.com",
                "AnyPassword",
                "BrandNewPassword123!"
        );

        // Anti-enumeration: returns quietly or does not leak account existence
        assertDoesNotThrow(() -> authService.resetPassword(request));
        verify(userRepository, never()).updatePassword(anyString(), anyString());
    }
}
