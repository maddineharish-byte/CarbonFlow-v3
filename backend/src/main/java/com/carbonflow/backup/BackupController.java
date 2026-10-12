package com.carbonflow.backup;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ApiResponse<Map<String, Object>> getBackupStatus() {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(backupService.getBackupStatus(orgId));
    }
}
