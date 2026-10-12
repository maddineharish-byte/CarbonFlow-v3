package com.carbonflow.carbon;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/carbon-data")
public class CarbonDataController {

    private final CarbonDataService carbonDataService;

    public CarbonDataController(CarbonDataService carbonDataService) {
        this.carbonDataService = carbonDataService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> listRecords(
            @RequestParam(required = false, defaultValue = "ALL") String period,
            @RequestParam(required = false, defaultValue = "ALL") String scope,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        List<CarbonDataDto> items = carbonDataService.searchRecords(orgId, period, scope, status, query, limit, offset);
        int total = carbonDataService.countRecords(orgId, period, scope, status, query);

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("limit", limit);
        result.put("offset", offset);

        return ApiResponse.ok(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<CarbonDataDto> getRecord(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(carbonDataService.getRecord(id, orgId));
    }

    @PostMapping
    public ApiResponse<CarbonDataDto> createRecord(@RequestBody CarbonDataDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        CarbonDataDto created = carbonDataService.createRecord(orgId, req);
        return ApiResponse.ok("Carbon data record created successfully", created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST')")
    public ApiResponse<CarbonDataDto> updateRecord(@PathVariable String id, @RequestBody CarbonDataDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        CarbonDataDto updated = carbonDataService.updateRecord(id, orgId, req);
        return ApiResponse.ok("Carbon data record updated successfully", updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<Void> deleteRecord(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        carbonDataService.deleteRecord(id, orgId);
        return ApiResponse.ok("Carbon data record deleted successfully", null);
    }

    @GetMapping("/emission-factors")
    public ApiResponse<List<EmissionFactorDto>> getEmissionFactors() {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(carbonDataService.getEmissionFactors(orgId));
    }

    @GetMapping("/summary")
    public ApiResponse<List<Map<String, Object>>> getEmissionsSummary(
            @RequestParam(required = false, defaultValue = "ALL") String period) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(carbonDataService.getEmissionsSummary(orgId, period));
    }
}
