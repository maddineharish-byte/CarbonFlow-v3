package com.carbonflow.finding;

import com.carbonflow.auditlog.AuditLogService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FindingService {

    private final FindingRepository findingRepository;
    private final AuditLogService auditLogService;

    public FindingService(FindingRepository findingRepository, AuditLogService auditLogService) {
        this.findingRepository = findingRepository;
        this.auditLogService = auditLogService;
    }

    public List<FindingDto> listFindings(String organizationId, String auditId, String severity, String status, String query, int limit, int offset) {
        return findingRepository.searchAndFilter(organizationId, auditId, severity, status, query, limit, offset);
    }

    public FindingDto getFinding(String id, String organizationId) {
        return findingRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Audit finding not found or access denied."));
    }

    public FindingDto createFinding(String organizationId, FindingDto.CreateUpdateRequest req) {
        String id = UUID.randomUUID().toString();
        FindingDto dto = new FindingDto(
                id,
                organizationId,
                req.auditId(),
                "",
                req.title(),
                req.description(),
                req.severity(),
                req.source(),
                req.relatedCarbonDataId(),
                req.relatedEvidenceId(),
                req.ownerId(),
                "",
                req.status() != null ? req.status() : "OPEN",
                req.dueDate(),
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        findingRepository.insert(dto);

        auditLogService.log(organizationId, "CREATE", "FINDING", id,
                "{\"title\":\"" + req.title() + "\",\"severity\":\"" + req.severity() + "\"}");

        return getFinding(id, organizationId);
    }

    public FindingDto updateFinding(String id, String organizationId, FindingDto.CreateUpdateRequest req) {
        FindingDto existing = getFinding(id, organizationId);

        LocalDateTime resDate = existing.resolutionDate();
        if (("RESOLVED".equalsIgnoreCase(req.status()) || "CLOSED".equalsIgnoreCase(req.status())) && resDate == null) {
            resDate = LocalDateTime.now();
        }

        FindingDto updated = new FindingDto(
                id,
                organizationId,
                req.auditId(),
                existing.auditName(),
                req.title(),
                req.description(),
                req.severity(),
                req.source(),
                req.relatedCarbonDataId(),
                req.relatedEvidenceId(),
                req.ownerId(),
                existing.ownerName(),
                req.status(),
                req.dueDate(),
                resDate,
                req.resolutionNotes(),
                existing.createdAt(),
                LocalDateTime.now()
        );

        findingRepository.update(updated);

        auditLogService.log(organizationId, "UPDATE", "FINDING", id,
                "{\"status\":\"" + req.status() + "\",\"severity\":\"" + req.severity() + "\"}");

        return getFinding(id, organizationId);
    }

    public void deleteFinding(String id, String organizationId) {
        FindingDto existing = getFinding(id, organizationId);
        findingRepository.delete(id, organizationId);

        auditLogService.log(organizationId, "DELETE", "FINDING", id,
                "{\"title\":\"" + existing.title() + "\"}");
    }
}
