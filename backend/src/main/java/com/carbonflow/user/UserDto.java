package com.carbonflow.user;

import java.time.LocalDateTime;

public record UserDto(
    String id,
    String email,
    String fullName,
    String title,
    String phone,
    UserRole role,
    String status,
    boolean active,
    LocalDateTime createdAt
) {}
