package com.carbonflow.compliance;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

    private final ComplianceService complianceService;

    public ComplianceController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    @GetMapping
    public ApiResponse<List<ComplianceDto>> listRequirements(
            @RequestParam(required = false, defaultValue = "ALL") String framework,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(complianceService.listRequirements(orgId, framework, status, query, limit, offset));
    }

    @GetMapping("/{id}")
    public ApiResponse<ComplianceDto> getRequirement(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(complianceService.getRequirement(id, orgId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<ComplianceDto> createRequirement(@RequestBody ComplianceDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        ComplianceDto created = complianceService.createRequirement(orgId, req);
        return ApiResponse.ok("Compliance requirement created", created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<ComplianceDto> updateRequirement(@PathVariable String id, @RequestBody ComplianceDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        ComplianceDto updated = complianceService.updateRequirement(id, orgId, req);
        return ApiResponse.ok("Compliance requirement updated", updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ApiResponse<Void> deleteRequirement(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        complianceService.deleteRequirement(id, orgId);
        return ApiResponse.ok("Compliance requirement deleted", null);
    }
}
