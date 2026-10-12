package com.carbonflow.audit;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audits")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ApiResponse<List<AuditDto>> listAudits(
            @RequestParam(required = false, defaultValue = "ALL") String period,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(auditService.listAudits(orgId, period, status, query, limit, offset));
    }

    @GetMapping("/{id}")
    public ApiResponse<AuditDto> getAudit(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(auditService.getAudit(id, orgId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<AuditDto> createAudit(@RequestBody AuditDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        AuditDto created = auditService.createAudit(orgId, req);
        return ApiResponse.ok("Audit engagement initialized", created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<AuditDto> updateAudit(@PathVariable String id, @RequestBody AuditDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        AuditDto updated = auditService.updateAudit(id, orgId, req);
        return ApiResponse.ok("Audit engagement updated", updated);
    }

    @PostMapping("/{auditId}/validate/{carbonDataId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST')")
    public ApiResponse<Void> validateCarbonData(
            @PathVariable String auditId,
            @PathVariable String carbonDataId,
            @RequestBody AuditDto.ValidateCarbonRequest req) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        auditService.validateCarbonItem(auditId, carbonDataId, orgId, req);
        return ApiResponse.ok("Validation record logged and synced successfully", null);
    }
}
