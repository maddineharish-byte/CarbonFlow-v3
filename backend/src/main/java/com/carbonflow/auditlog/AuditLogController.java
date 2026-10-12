package com.carbonflow.auditlog;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUSTAINABILITY_MANAGER')")
    public ApiResponse<List<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false, defaultValue = "ALL") String entityType,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {
        
        String orgId = SecurityUtils.getCurrentOrganizationId();
        List<AuditLogDto> logs = auditLogService.getAuditLogs(orgId, entityType, limit, offset);
        return ApiResponse.ok(logs);
    }
}
