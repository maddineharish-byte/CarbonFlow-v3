package com.carbonflow.organization;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/current")
    public ApiResponse<OrganizationDto> getCurrentOrganization() {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return organizationService.getOrganization(orgId)
                .map(ApiResponse::ok)
                .orElseGet(() -> ApiResponse.error("Organization not found", "NOT_FOUND"));
    }

    @PutMapping("/current")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ApiResponse<OrganizationDto> updateCurrentOrganization(@RequestBody OrganizationDto updateReq) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        OrganizationDto updated = new OrganizationDto(
                orgId,
                updateReq.name(),
                updateReq.industry(),
                updateReq.country(),
                updateReq.location(),
                updateReq.description(),
                updateReq.reportingPeriod(),
                null,
                null
        );
        return ApiResponse.ok("Organization details updated successfully", organizationService.updateOrganization(updated));
    }
}
