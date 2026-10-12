package com.carbonflow.report;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<ReportDto.DashboardStats> getDashboardStats() {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(reportService.getDashboardStats(orgId));
    }

    @GetMapping("/export/carbon-csv")
    public ResponseEntity<String> exportCarbonCsv(@RequestParam(required = false, defaultValue = "ALL") String period) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        ReportDto.ExportDataResponse res = reportService.exportCarbonDataCsv(orgId, period);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.filename() + "\"")
                .contentType(MediaType.parseMediaType(res.mimeType()))
                .body(res.csvContent());
    }

    @GetMapping("/export/audits-csv")
    public ResponseEntity<String> exportAuditsCsv() {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        ReportDto.ExportDataResponse res = reportService.exportAuditSummaryCsv(orgId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.filename() + "\"")
                .contentType(MediaType.parseMediaType(res.mimeType()))
                .body(res.csvContent());
    }
}
