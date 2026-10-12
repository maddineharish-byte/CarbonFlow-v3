package com.carbonflow.report;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ReportService(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public ReportDto.DashboardStats getDashboardStats(String organizationId) {
        MapSqlParameterSource orgParam = new MapSqlParameterSource("orgId", organizationId);

        // 1. Carbon stats
        String carbonSql = """
                SELECT
                    COUNT(*) as total_records,
                    COALESCE(SUM(calculated_emissions), 0) as total_emissions,
                    COALESCE(SUM(CASE WHEN scope = 'SCOPE_1' THEN calculated_emissions ELSE 0 END), 0) as s1,
                    COALESCE(SUM(CASE WHEN scope = 'SCOPE_2' THEN calculated_emissions ELSE 0 END), 0) as s2,
                    COALESCE(SUM(CASE WHEN scope = 'SCOPE_3' THEN calculated_emissions ELSE 0 END), 0) as s3
                FROM carbon_data
                WHERE organization_id = :orgId
                """;
        Map<String, Object> carbonMap = jdbcTemplate.queryForMap(carbonSql, orgParam);
        long totalCarbonRecords = ((Number) carbonMap.getOrDefault("total_records", 0)).longValue();
        double totalEmissions = roundDouble(((Number) carbonMap.getOrDefault("total_emissions", 0.0)).doubleValue());
        double s1 = roundDouble(((Number) carbonMap.getOrDefault("s1", 0.0)).doubleValue());
        double s2 = roundDouble(((Number) carbonMap.getOrDefault("s2", 0.0)).doubleValue());
        double s3 = roundDouble(((Number) carbonMap.getOrDefault("s3", 0.0)).doubleValue());

        // 2. Evidence stats
        String evidenceSql = """
                SELECT
                    COUNT(*) as total_evidence,
                    COALESCE(SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END), 0) as verified,
                    COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending
                FROM evidence
                WHERE organization_id = :orgId
                """;
        Map<String, Object> evidenceMap = jdbcTemplate.queryForMap(evidenceSql, orgParam);
        long totalEvidence = ((Number) evidenceMap.getOrDefault("total_evidence", 0)).longValue();
        long verifiedEvidence = ((Number) evidenceMap.getOrDefault("verified", 0)).longValue();
        long pendingEvidence = ((Number) evidenceMap.getOrDefault("pending", 0)).longValue();

        // 3. Active Audits
        String auditsSql = "SELECT COUNT(*) FROM audits WHERE organization_id = :orgId AND status IN ('SCHEDULED', 'IN_PROGRESS', 'UNDER_REVIEW')";
        long activeAudits = jdbcTemplate.queryForObject(auditsSql, orgParam, Long.class);

        // 4. Findings
        String findingsSql = """
                SELECT
                    COALESCE(SUM(CASE WHEN status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) as open_findings,
                    COALESCE(SUM(CASE WHEN status IN ('OPEN', 'IN_PROGRESS') AND due_date < :today THEN 1 ELSE 0 END), 0) as overdue_findings
                FROM findings
                WHERE organization_id = :orgId
                """;
        MapSqlParameterSource findingsParam = new MapSqlParameterSource("orgId", organizationId).addValue("today", Date.valueOf(LocalDate.now()));
        Map<String, Object> findingsMap = jdbcTemplate.queryForMap(findingsSql, findingsParam);
        long openFindings = ((Number) findingsMap.getOrDefault("open_findings", 0)).longValue();
        long overdueFindings = ((Number) findingsMap.getOrDefault("overdue_findings", 0)).longValue();

        // 5. Corrective Actions
        String actionsSql = """
                SELECT
                    COUNT(*) as total_actions,
                    COALESCE(SUM(CASE WHEN status NOT IN ('COMPLETED', 'VERIFIED', 'CLOSED') AND due_date < :today THEN 1 ELSE 0 END), 0) as overdue_actions
                FROM corrective_actions
                WHERE organization_id = :orgId
                """;
        Map<String, Object> actionsMap = jdbcTemplate.queryForMap(actionsSql, findingsParam);
        long totalActions = ((Number) actionsMap.getOrDefault("total_actions", 0)).longValue();
        long overdueActions = ((Number) actionsMap.getOrDefault("overdue_actions", 0)).longValue();

        // 6. Compliance Requirements
        String compSql = """
                SELECT
                    COUNT(*) as total_comp,
                    COALESCE(SUM(CASE WHEN status = 'COMPLIANT' THEN 1 ELSE 0 END), 0) as compliant
                FROM compliance_requirements
                WHERE organization_id = :orgId
                """;
        Map<String, Object> compMap = jdbcTemplate.queryForMap(compSql, orgParam);
        long totalRequirements = ((Number) compMap.getOrDefault("total_comp", 0)).longValue();
        long compliantRequirements = ((Number) compMap.getOrDefault("compliant", 0)).longValue();

        // 7. Emissions by Scope breakdown
        List<ReportDto.ScopeBreakdownItem> scopeBreakdown = new ArrayList<>();
        double safeTotal = totalEmissions > 0 ? totalEmissions : 1.0;
        scopeBreakdown.add(new ReportDto.ScopeBreakdownItem("Scope 1 (Direct)", 0, s1, roundDouble((s1 / safeTotal) * 100)));
        scopeBreakdown.add(new ReportDto.ScopeBreakdownItem("Scope 2 (Indirect Grid)", 0, s2, roundDouble((s2 / safeTotal) * 100)));
        scopeBreakdown.add(new ReportDto.ScopeBreakdownItem("Scope 3 (Value Chain)", 0, s3, roundDouble((s3 / safeTotal) * 100)));

        // 8. Trends & distributions
        String periodSql = """
                SELECT reporting_period, COALESCE(SUM(calculated_emissions), 0) as total_emissions
                FROM carbon_data
                WHERE organization_id = :orgId
                GROUP BY reporting_period
                ORDER BY reporting_period ASC
                """;
        List<Map<String, Object>> periodTrend = jdbcTemplate.queryForList(periodSql, orgParam);

        String findingsSevSql = """
                SELECT severity, COUNT(*) as count
                FROM findings
                WHERE organization_id = :orgId
                GROUP BY severity
                """;
        List<Map<String, Object>> findingsBySeverity = jdbcTemplate.queryForList(findingsSevSql, orgParam);

        String caStatusSql = """
                SELECT status, COUNT(*) as count
                FROM corrective_actions
                WHERE organization_id = :orgId
                GROUP BY status
                """;
        List<Map<String, Object>> caByStatus = jdbcTemplate.queryForList(caStatusSql, orgParam);

        String compStatusSql = """
                SELECT status, COUNT(*) as count
                FROM compliance_requirements
                WHERE organization_id = :orgId
                GROUP BY status
                """;
        List<Map<String, Object>> compByStatus = jdbcTemplate.queryForList(compStatusSql, orgParam);

        return new ReportDto.DashboardStats(
                totalCarbonRecords,
                totalEmissions,
                s1,
                s2,
                s3,
                totalEvidence,
                verifiedEvidence,
                pendingEvidence,
                activeAudits,
                openFindings,
                overdueFindings,
                totalActions,
                overdueActions,
                compliantRequirements,
                totalRequirements,
                scopeBreakdown,
                periodTrend,
                findingsBySeverity,
                caByStatus,
                compByStatus
        );
    }

    public ReportDto.ExportDataResponse exportCarbonDataCsv(String organizationId, String period) {
        StringBuilder sql = new StringBuilder("""
                SELECT reporting_period, scope, category, activity_type, activity_amount, unit,
                       emission_factor, calculated_emissions, source, data_owner, status, notes
                FROM carbon_data
                WHERE organization_id = :orgId
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("orgId", organizationId);
        if (period != null && !period.isBlank() && !period.equalsIgnoreCase("ALL")) {
            sql.append(" AND reporting_period = :period ");
            params.addValue("period", period);
        }
        sql.append(" ORDER BY reporting_period DESC, scope ASC ");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params);

        StringBuilder csv = new StringBuilder();
        csv.append("Reporting Period,Scope,Category,Activity Type,Activity Amount,Unit,Emission Factor,Calculated Emissions (tCO2e),Source,Data Owner,Status,Notes\n");
        for (Map<String, Object> r : rows) {
            csv.append(escape(r.get("reporting_period"))).append(",")
               .append(escape(r.get("scope"))).append(",")
               .append(escape(r.get("category"))).append(",")
               .append(escape(r.get("activity_type"))).append(",")
               .append(r.get("activity_amount")).append(",")
               .append(escape(r.get("unit"))).append(",")
               .append(r.get("emission_factor")).append(",")
               .append(r.get("calculated_emissions")).append(",")
               .append(escape(r.get("source"))).append(",")
               .append(escape(r.get("data_owner"))).append(",")
               .append(escape(r.get("status"))).append(",")
               .append(escape(r.get("notes"))).append("\n");
        }

        return new ReportDto.ExportDataResponse("carbon_emissions_report.csv", "text/csv", csv.toString());
    }

    public ReportDto.ExportDataResponse exportAuditSummaryCsv(String organizationId) {
        String sql = """
                SELECT a.audit_name, a.audit_period, a.audit_type, a.scope, a.lead_auditor,
                       a.start_date, a.due_date, a.status,
                       COUNT(f.id) as findings_count
                FROM audits a
                LEFT JOIN findings f ON a.id = f.audit_id
                WHERE a.organization_id = :orgId
                GROUP BY a.id, a.audit_name, a.audit_period, a.audit_type, a.scope, a.lead_auditor, a.start_date, a.due_date, a.status
                ORDER BY a.start_date DESC
                """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, new MapSqlParameterSource("orgId", organizationId));

        StringBuilder csv = new StringBuilder();
        csv.append("Audit Name,Period,Type,Scope,Lead Auditor,Start Date,Due Date,Status,Findings Count\n");
        for (Map<String, Object> r : rows) {
            csv.append(escape(r.get("audit_name"))).append(",")
               .append(escape(r.get("audit_period"))).append(",")
               .append(escape(r.get("audit_type"))).append(",")
               .append(escape(r.get("scope"))).append(",")
               .append(escape(r.get("lead_auditor"))).append(",")
               .append(r.get("start_date")).append(",")
               .append(r.get("due_date")).append(",")
               .append(escape(r.get("status"))).append(",")
               .append(r.get("findings_count")).append("\n");
        }

        return new ReportDto.ExportDataResponse("audits_summary_report.csv", "text/csv", csv.toString());
    }

    private String escape(Object obj) {
        if (obj == null) return "\"\"";
        String s = obj.toString().replace("\"", "\"\"");
        return "\"" + s + "\"";
    }

    private double roundDouble(double val) {
        return BigDecimal.valueOf(val).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }
}
