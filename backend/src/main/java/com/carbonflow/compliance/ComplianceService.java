package com.carbonflow.compliance;

import com.carbonflow.auditlog.AuditLogService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ComplianceService {

    private final ComplianceRepository complianceRepository;
    private final AuditLogService auditLogService;

    public ComplianceService(ComplianceRepository complianceRepository, AuditLogService auditLogService) {
        this.complianceRepository = complianceRepository;
        this.auditLogService = auditLogService;
    }

    public List<ComplianceDto> listRequirements(String organizationId, String framework, String status, String query, int limit, int offset) {
        return complianceRepository.searchAndFilter(organizationId, framework, status, query, limit, offset);
    }

    public ComplianceDto getRequirement(String id, String organizationId) {
        return complianceRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Compliance requirement record not found or access denied."));
    }

    public ComplianceDto createRequirement(String organizationId, ComplianceDto.CreateUpdateRequest req) {
        String id = UUID.randomUUID().toString();
        ComplianceDto dto = new ComplianceDto(
                id,
                organizationId,
                req.requirementCode(),
                req.framework(),
                req.requirementName(),
                req.description(),
                req.applicability(),
                req.ownerId(),
                "",
                req.status() != null ? req.status() : "IN_PROGRESS",
                req.dueDate(),
                req.linkedEvidenceId(),
                null,
                req.linkedAuditId(),
                null,
                req.notes(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        complianceRepository.insert(dto);

        auditLogService.log(organizationId, "CREATE", "COMPLIANCE", id,
                "{\"code\":\"" + req.requirementCode() + "\",\"framework\":\"" + req.framework() + "\"}");

        return getRequirement(id, organizationId);
    }

    public ComplianceDto updateRequirement(String id, String organizationId, ComplianceDto.CreateUpdateRequest req) {
        ComplianceDto existing = getRequirement(id, organizationId);

        ComplianceDto updated = new ComplianceDto(
                id,
                organizationId,
                req.requirementCode(),
                req.framework(),
                req.requirementName(),
                req.description(),
                req.applicability(),
                req.ownerId(),
                existing.ownerName(),
                req.status(),
                req.dueDate(),
                req.linkedEvidenceId(),
                existing.linkedEvidenceName(),
                req.linkedAuditId(),
                existing.linkedAuditName(),
                req.notes(),
                existing.createdAt(),
                LocalDateTime.now()
        );

        complianceRepository.update(updated);

        auditLogService.log(organizationId, "UPDATE", "COMPLIANCE", id,
                "{\"status\":\"" + req.status() + "\"}");

        return getRequirement(id, organizationId);
    }

    public void deleteRequirement(String id, String organizationId) {
        ComplianceDto existing = getRequirement(id, organizationId);
        complianceRepository.delete(id, organizationId);

        auditLogService.log(organizationId, "DELETE", "COMPLIANCE", id,
                "{\"code\":\"" + existing.requirementCode() + "\"}");
    }
}
