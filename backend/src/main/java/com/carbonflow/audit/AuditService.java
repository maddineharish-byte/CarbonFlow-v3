package com.carbonflow.audit;

import com.carbonflow.auditlog.AuditLogService;
import com.carbonflow.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditRepository auditRepository;
    private final AuditLogService auditLogService;

    public AuditService(AuditRepository auditRepository, AuditLogService auditLogService) {
        this.auditRepository = auditRepository;
        this.auditLogService = auditLogService;
    }

    public List<AuditDto> listAudits(String organizationId, String period, String status, String query, int limit, int offset) {
        return auditRepository.searchAndFilter(organizationId, period, status, query, limit, offset);
    }

    public AuditDto getAudit(String id, String organizationId) {
        return auditRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Audit engagement not found or access denied."));
    }

    public AuditDto createAudit(String organizationId, AuditDto.CreateUpdateRequest req) {
        String id = UUID.randomUUID().toString();
        String currentUserId = SecurityUtils.getCurrentUserId();

        AuditDto dto = new AuditDto(
                id,
                organizationId,
                req.auditName(),
                req.auditPeriod(),
                req.auditType(),
                req.scope(),
                req.leadAuditor(),
                req.startDate(),
                req.dueDate(),
                req.status() != null ? req.status() : "DRAFT",
                req.description(),
                req.completionNotes(),
                null,
                currentUserId != null ? currentUserId : "SYSTEM",
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of()
        );

        auditRepository.insert(dto);

        if (req.carbonDataIds() != null) {
            for (String carbonId : req.carbonDataIds()) {
                auditRepository.linkCarbonData(id, carbonId);
            }
        }

        auditLogService.log(organizationId, "CREATE", "AUDIT", id,
                "{\"auditName\":\"" + req.auditName() + "\",\"scope\":\"" + req.scope() + "\"}");

        return getAudit(id, organizationId);
    }

    public AuditDto updateAudit(String id, String organizationId, AuditDto.CreateUpdateRequest req) {
        AuditDto existing = getAudit(id, organizationId);

        LocalDateTime closedAt = existing.closedAt();
        if ("CLOSED".equalsIgnoreCase(req.status()) && closedAt == null) {
            closedAt = LocalDateTime.now();
        }

        AuditDto updated = new AuditDto(
                id,
                organizationId,
                req.auditName(),
                req.auditPeriod(),
                req.auditType(),
                req.scope(),
                req.leadAuditor(),
                req.startDate(),
                req.dueDate(),
                req.status(),
                req.description(),
                req.completionNotes(),
                closedAt,
                existing.createdBy(),
                existing.createdAt(),
                LocalDateTime.now(),
                List.of()
        );

        auditRepository.update(updated);

        if (req.carbonDataIds() != null) {
            for (String carbonId : req.carbonDataIds()) {
                auditRepository.linkCarbonData(id, carbonId);
            }
        }

        auditLogService.log(organizationId, "AUDIT_STATUS_CHANGE", "AUDIT", id,
                "{\"status\":\"" + req.status() + "\"}");

        return getAudit(id, organizationId);
    }

    public void validateCarbonItem(String auditId, String carbonDataId, String organizationId, AuditDto.ValidateCarbonRequest req) {
        // Ensure audit belongs to organization
        getAudit(auditId, organizationId);

        String currentUserId = SecurityUtils.getCurrentUserId();
        auditRepository.validateCarbonItem(auditId, carbonDataId, req.status(), currentUserId, req.comments());

        auditLogService.log(organizationId, "VALIDATE", "CARBON_DATA", carbonDataId,
                "{\"auditId\":\"" + auditId + "\",\"status\":\"" + req.status() + "\",\"comments\":\"" + req.comments() + "\"}");
    }
}
