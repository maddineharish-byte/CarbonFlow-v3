package com.carbonflow.evidence;

import com.carbonflow.auditlog.AuditLogService;
import com.carbonflow.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final AuditLogService auditLogService;

    public EvidenceService(EvidenceRepository evidenceRepository, AuditLogService auditLogService) {
        this.evidenceRepository = evidenceRepository;
        this.auditLogService = auditLogService;
    }

    public List<EvidenceDto> listEvidence(String organizationId, String period, String status, String type, String query, int limit, int offset) {
        return evidenceRepository.searchAndFilter(organizationId, period, status, type, query, limit, offset);
    }

    public int countEvidence(String organizationId, String period, String status, String type, String query) {
        return evidenceRepository.count(organizationId, period, status, type, query);
    }

    public EvidenceDto getEvidence(String id, String organizationId) {
        return evidenceRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence document not found or access denied."));
    }

    public EvidenceDto createEvidence(String organizationId, EvidenceDto.CreateUpdateRequest req) {
        String id = UUID.randomUUID().toString();
        EvidenceDto dto = new EvidenceDto(
                id,
                organizationId,
                req.evidenceName(),
                req.evidenceType(),
                req.reportingPeriod(),
                req.source(),
                req.owner(),
                LocalDateTime.now(),
                "PENDING",
                req.description(),
                req.fileUrl() != null && !req.fileUrl().isBlank() ? req.fileUrl() : "https://storage.carbonflow.io/evidence/" + organizationId + "/" + id + ".pdf",
                req.fileSizeBytes() != null ? req.fileSizeBytes() : 1024 * 512,
                req.mimeType() != null ? req.mimeType() : "application/pdf",
                req.linkedCarbonDataId(),
                req.linkedAuditId(),
                null,
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        evidenceRepository.insert(dto);

        auditLogService.log(organizationId, "CREATE", "EVIDENCE", id,
                "{\"name\":\"" + req.evidenceName() + "\",\"type\":\"" + req.evidenceType() + "\"}");

        return dto;
    }

    public EvidenceDto verifyEvidence(String id, String organizationId, EvidenceDto.VerifyRequest req) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        evidenceRepository.updateVerification(id, organizationId, req.status(), currentUserId, req.verificationNotes());

        auditLogService.log(organizationId, "EVIDENCE_VERIFY", "EVIDENCE", id,
                "{\"status\":\"" + req.status() + "\",\"notes\":\"" + req.verificationNotes() + "\"}");

        return getEvidence(id, organizationId);
    }

    public void deleteEvidence(String id, String organizationId) {
        EvidenceDto existing = getEvidence(id, organizationId);
        evidenceRepository.delete(id, organizationId);

        auditLogService.log(organizationId, "DELETE", "EVIDENCE", id,
                "{\"name\":\"" + existing.evidenceName() + "\"}");
    }
}
