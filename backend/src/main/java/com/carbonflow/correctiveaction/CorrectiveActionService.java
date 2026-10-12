package com.carbonflow.correctiveaction;

import com.carbonflow.auditlog.AuditLogService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CorrectiveActionService {

    private final CorrectiveActionRepository correctiveActionRepository;
    private final AuditLogService auditLogService;

    public CorrectiveActionService(CorrectiveActionRepository correctiveActionRepository, AuditLogService auditLogService) {
        this.correctiveActionRepository = correctiveActionRepository;
        this.auditLogService = auditLogService;
    }

    public List<CorrectiveActionDto> listCorrectiveActions(String organizationId, String findingId, String priority, String status, String ownerId, int limit, int offset) {
        return correctiveActionRepository.searchAndFilter(organizationId, findingId, priority, status, ownerId, limit, offset);
    }

    public CorrectiveActionDto getCorrectiveAction(String id, String organizationId) {
        return correctiveActionRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Corrective action not found or access denied."));
    }

    public CorrectiveActionDto createCorrectiveAction(String organizationId, CorrectiveActionDto.CreateUpdateRequest req) {
        String id = UUID.randomUUID().toString();
        CorrectiveActionDto dto = new CorrectiveActionDto(
                id,
                organizationId,
                req.findingId(),
                "",
                "",
                req.actionTitle(),
                req.description(),
                req.ownerId(),
                "",
                req.priority(),
                req.dueDate(),
                req.status() != null ? req.status() : "OPEN",
                null,
                req.completionNotes(),
                req.completionEvidenceId(),
                false,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        correctiveActionRepository.insert(dto);

        auditLogService.log(organizationId, "CREATE", "CORRECTIVE_ACTION", id,
                "{\"title\":\"" + req.actionTitle() + "\",\"priority\":\"" + req.priority() + "\"}");

        return getCorrectiveAction(id, organizationId);
    }

    public CorrectiveActionDto updateCorrectiveAction(String id, String organizationId, CorrectiveActionDto.CreateUpdateRequest req) {
        CorrectiveActionDto existing = getCorrectiveAction(id, organizationId);

        LocalDateTime compDate = existing.completionDate();
        if (("COMPLETED".equalsIgnoreCase(req.status()) || "VERIFIED".equalsIgnoreCase(req.status()) || "CLOSED".equalsIgnoreCase(req.status())) && compDate == null) {
            compDate = LocalDateTime.now();
        }

        CorrectiveActionDto updated = new CorrectiveActionDto(
                id,
                organizationId,
                req.findingId(),
                existing.findingTitle(),
                existing.findingSeverity(),
                req.actionTitle(),
                req.description(),
                req.ownerId(),
                existing.ownerName(),
                req.priority(),
                req.dueDate(),
                req.status(),
                compDate,
                req.completionNotes(),
                req.completionEvidenceId(),
                false,
                existing.createdAt(),
                LocalDateTime.now()
        );

        correctiveActionRepository.update(updated);

        auditLogService.log(organizationId, "UPDATE", "CORRECTIVE_ACTION", id,
                "{\"status\":\"" + req.status() + "\"}");

        return getCorrectiveAction(id, organizationId);
    }

    public void deleteCorrectiveAction(String id, String organizationId) {
        CorrectiveActionDto existing = getCorrectiveAction(id, organizationId);
        correctiveActionRepository.delete(id, organizationId);

        auditLogService.log(organizationId, "DELETE", "CORRECTIVE_ACTION", id,
                "{\"title\":\"" + existing.actionTitle() + "\"}");
    }
}
