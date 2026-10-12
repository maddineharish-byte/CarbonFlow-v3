package com.carbonflow.user;

public enum UserRole {
    COMPANY_ADMIN,
    SUSTAINABILITY_MANAGER,
    ANALYST,
    EMPLOYEE;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
