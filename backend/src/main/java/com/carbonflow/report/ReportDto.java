package com.carbonflow.report;

import java.util.List;
import java.util.Map;

public class ReportDto {

    public record DashboardStats(
        long totalCarbonRecords,
        double totalEmissions,
        double scope1Emissions,
        double scope2Emissions,
        double scope3Emissions,
        long totalEvidenceRecords,
        long verifiedEvidenceRecords,
        long pendingEvidenceRecords,
        long activeAudits,
        long openFindings,
        long overdueFindings,
        long totalCorrectiveActions,
        long overdueCorrectiveActions,
        long compliantRequirements,
        long totalRequirements,
        List<ScopeBreakdownItem> emissionsByScope,
        List<Map<String, Object>> emissionsByPeriod,
        List<Map<String, Object>> findingsBySeverity,
        List<Map<String, Object>> correctiveActionsByStatus,
        List<Map<String, Object>> complianceByStatus
    ) {}

    public record ScopeBreakdownItem(
        String scope,
        long recordCount,
        double emissionsTotal,
        double percentage
    ) {}

    public record ExportDataResponse(
        String filename,
        String mimeType,
        String csvContent
    ) {}
}
