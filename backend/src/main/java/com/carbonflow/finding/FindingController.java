package com.carbonflow.finding;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/findings")
public class FindingController {

    private final FindingService findingService;

    public FindingController(FindingService findingService) {
        this.findingService = findingService;
    }

    @GetMapping
    public ApiResponse<List<FindingDto>> listFindings(
            @RequestParam(required = false, defaultValue = "ALL") String auditId,
            @RequestParam(required = false, defaultValue = "ALL") String severity,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(findingService.listFindings(orgId, auditId, severity, status, query, limit, offset));
    }

    @GetMapping("/{id}")
    public ApiResponse<FindingDto> getFinding(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(findingService.getFinding(id, orgId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<FindingDto> createFinding(@RequestBody FindingDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        FindingDto created = findingService.createFinding(orgId, req);
        return ApiResponse.ok("Audit finding logged", created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST')")
    public ApiResponse<FindingDto> updateFinding(@PathVariable String id, @RequestBody FindingDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        FindingDto updated = findingService.updateFinding(id, orgId, req);
        return ApiResponse.ok("Audit finding updated", updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<Void> deleteFinding(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        findingService.deleteFinding(id, orgId);
        return ApiResponse.ok("Finding record deleted", null);
    }
}
