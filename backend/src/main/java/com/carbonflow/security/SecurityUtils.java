package com.carbonflow.security;

import com.carbonflow.user.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        return null;
    }

    public static String getCurrentUserId() {
        UserPrincipal principal = getCurrentUser();
        return principal != null ? principal.getUserId() : null;
    }

    public static String getCurrentOrganizationId() {
        UserPrincipal principal = getCurrentUser();
        return principal != null ? principal.getOrganizationId() : null;
    }

    public static UserRole getCurrentRole() {
        UserPrincipal principal = getCurrentUser();
        return principal != null ? principal.getRole() : null;
    }

    public static boolean hasRole(UserRole role) {
        UserRole current = getCurrentRole();
        return current != null && current == role;
    }

    public static boolean isCompanyAdmin() {
        return hasRole(UserRole.COMPANY_ADMIN);
    }

    public static boolean isSustainabilityManagerOrAdmin() {
        UserRole current = getCurrentRole();
        return current == UserRole.COMPANY_ADMIN || current == UserRole.SUSTAINABILITY_MANAGER;
    }

    public static boolean isAnalystOrHigher() {
        UserRole current = getCurrentRole();
        return current == UserRole.COMPANY_ADMIN || 
               current == UserRole.SUSTAINABILITY_MANAGER || 
               current == UserRole.ANALYST;
    }
}
