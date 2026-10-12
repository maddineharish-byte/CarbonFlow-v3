package com.carbonflow.common;

public class TenantContext {
    private static final ThreadLocal<String> CURRENT_ORGANIZATION_ID = new ThreadLocal<>();

    public static void setOrganizationId(String organizationId) {
        CURRENT_ORGANIZATION_ID.set(organizationId);
    }

    public static String getOrganizationId() {
        return CURRENT_ORGANIZATION_ID.get();
    }

    public static void clear() {
        CURRENT_ORGANIZATION_ID.remove();
    }
}
