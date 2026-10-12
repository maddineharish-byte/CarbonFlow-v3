package com.carbonflow.auth;

import com.carbonflow.user.UserRole;

public class AuthDto {
    public record LoginRequest(String email, String password) {}
    
    public record RegisterRequest(
            String organizationName,
            String industry,
            String country,
            String fullName,
            String email,
            String password,
            String title
    ) {}

    public record AuthResponse(
            String token,
            String userId,
            String email,
            String fullName,
            String organizationId,
            String organizationName,
            UserRole role
    ) {}

    public record PasswordResetRequest(String email, String oldPassword, String newPassword) {}
}
