package com.carbonflow.evidence;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evidence")
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> listEvidence(
            @RequestParam(required = false, defaultValue = "ALL") String period,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        List<EvidenceDto> items = evidenceService.listEvidence(orgId, period, status, type, query, limit, offset);
        int total = evidenceService.countEvidence(orgId, period, status, type, query);

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("limit", limit);
        result.put("offset", offset);

        return ApiResponse.ok(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<EvidenceDto> getEvidence(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(evidenceService.getEvidence(id, orgId));
    }

    @PostMapping
    public ApiResponse<EvidenceDto> createEvidence(@RequestBody EvidenceDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        EvidenceDto created = evidenceService.createEvidence(orgId, req);
        return ApiResponse.ok("Evidence uploaded and logged successfully", created);
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<EvidenceDto> verifyEvidence(@PathVariable String id, @RequestBody EvidenceDto.VerifyRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        EvidenceDto updated = evidenceService.verifyEvidence(id, orgId, req);
        return ApiResponse.ok("Evidence verification updated successfully", updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<Void> deleteEvidence(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        evidenceService.deleteEvidence(id, orgId);
        return ApiResponse.ok("Evidence record deleted successfully", null);
    }
}
