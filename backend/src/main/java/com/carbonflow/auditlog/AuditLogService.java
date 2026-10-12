package com.carbonflow.auditlog;

import com.carbonflow.security.SecurityUtils;
import com.carbonflow.security.UserPrincipal;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String organizationId, String action, String entityType, String entityId, String metadata) {
        UserPrincipal user = SecurityUtils.getCurrentUser();
        String actorId = user != null ? user.getUserId() : "SYSTEM";
        String actorName = user != null ? user.getFullName() : "System Process";
        String actorEmail = user != null ? user.getUsername() : "system@carbonflow.io";
        
        auditLogRepository.create(organizationId, actorId, actorName, actorEmail, action, entityType, entityId, metadata, "127.0.0.1");
    }

    public void log(String organizationId, String actorId, String actorName, String actorEmail, String action, String entityType, String entityId, String metadata) {
        auditLogRepository.create(organizationId, actorId, actorName, actorEmail, action, entityType, entityId, metadata, "127.0.0.1");
    }

    public List<AuditLogDto> getAuditLogs(String organizationId, String entityType, int limit, int offset) {
        return auditLogRepository.findByOrganization(organizationId, entityType, limit, offset);
    }
}
