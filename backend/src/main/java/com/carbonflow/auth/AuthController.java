package com.carbonflow.auth;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import com.carbonflow.security.UserPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthDto.AuthResponse> login(@RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ApiResponse.ok("Login successful", response);
    }

    @PostMapping("/register")
    public ApiResponse<AuthDto.AuthResponse> register(@RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request);
        return ApiResponse.ok("Organization registered successfully", response);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody AuthDto.PasswordResetRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Password reset successfully", null);
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> getCurrentUser() {
        UserPrincipal principal = SecurityUtils.getCurrentUser();
        if (principal == null) {
            return ApiResponse.error("Not authenticated", "UNAUTHORIZED");
        }
        return ApiResponse.ok(Map.of(
                "userId", principal.getUserId(),
                "email", principal.getUsername(),
                "fullName", principal.getFullName(),
                "organizationId", principal.getOrganizationId(),
                "role", principal.getRole()
        ));
    }

    @GetMapping("/demo-accounts")
    public ApiResponse<List<Map<String, String>>> getDemoAccounts() {
        return ApiResponse.ok(List.of(
                Map.of(
                        "role", "Company Admin",
                        "email", "admin@carbonflow.io",
                        "password", "Password123!",
                        "description", "Full executive governance, audit trail, user invites, settings"
                ),
                Map.of(
                        "role", "Sustainability Manager",
                        "email", "sustainability@carbonflow.io",
                        "password", "Password123!",
                        "description", "Carbon audits, evidence verification, findings, corrective actions"
                ),
                Map.of(
                        "role", "Analyst",
                        "email", "analyst@carbonflow.io",
                        "password", "Password123!",
                        "description", "Carbon data entry, evidence ingestion, assigned audit validation"
                ),
                Map.of(
                        "role", "Employee",
                        "email", "employee@carbonflow.io",
                        "password", "Password123!",
                        "description", "Facility activity submissions, assigned corrective action resolution"
                )
        ));
    }
}
