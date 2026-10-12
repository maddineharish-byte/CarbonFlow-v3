package com.carbonflow.correctiveaction;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/corrective-actions")
public class CorrectiveActionController {

    private final CorrectiveActionService correctiveActionService;

    public CorrectiveActionController(CorrectiveActionService correctiveActionService) {
        this.correctiveActionService = correctiveActionService;
    }

    @GetMapping
    public ApiResponse<List<CorrectiveActionDto>> listCorrectiveActions(
            @RequestParam(required = false, defaultValue = "ALL") String findingId,
            @RequestParam(required = false, defaultValue = "ALL") String priority,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String ownerId,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {

        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(correctiveActionService.listCorrectiveActions(orgId, findingId, priority, status, ownerId, limit, offset));
    }

    @GetMapping("/{id}")
    public ApiResponse<CorrectiveActionDto> getCorrectiveAction(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(correctiveActionService.getCorrectiveAction(id, orgId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER', 'ANALYST')")
    public ApiResponse<CorrectiveActionDto> createCorrectiveAction(@RequestBody CorrectiveActionDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        CorrectiveActionDto created = correctiveActionService.createCorrectiveAction(orgId, req);
        return ApiResponse.ok("Corrective action registered", created);
    }

    @PutMapping("/{id}")
    public ApiResponse<CorrectiveActionDto> updateCorrectiveAction(@PathVariable String id, @RequestBody CorrectiveActionDto.CreateUpdateRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        CorrectiveActionDto updated = correctiveActionService.updateCorrectiveAction(id, orgId, req);
        return ApiResponse.ok("Corrective action updated", updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<Void> deleteCorrectiveAction(@PathVariable String id) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        correctiveActionService.deleteCorrectiveAction(id, orgId);
        return ApiResponse.ok("Corrective action deleted", null);
    }
}
