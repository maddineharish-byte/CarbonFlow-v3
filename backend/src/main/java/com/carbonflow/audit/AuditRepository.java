package com.carbonflow.audit;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AuditRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AuditRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<AuditDto> findByIdAndOrg(String id, String organizationId) {
        String sql = """
                SELECT id, organization_id, audit_name, audit_period, audit_type, scope,
                       lead_auditor, start_date, due_date, status, description, completion_notes,
                       closed_at, created_by, created_at, updated_at
                FROM audits
                WHERE id = :id AND organization_id = :orgId
                """;
        try {
            AuditDto base = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("id", id).addValue("orgId", organizationId),
                    (rs, rowNum) -> new AuditDto(
                            rs.getString("id"),
                            rs.getString("organization_id"),
                            rs.getString("audit_name"),
                            rs.getString("audit_period"),
                            rs.getString("audit_type"),
                            rs.getString("scope"),
                            rs.getString("lead_auditor"),
                            rs.getDate("start_date") != null ? rs.getDate("start_date").toLocalDate() : null,
                            rs.getDate("due_date") != null ? rs.getDate("due_date").toLocalDate() : null,
                            rs.getString("status"),
                            rs.getString("description"),
                            rs.getString("completion_notes"),
                            rs.getTimestamp("closed_at") != null ? rs.getTimestamp("closed_at").toLocalDateTime() : null,
                            rs.getString("created_by"),
                            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
                            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null,
                            List.of()
                    )
            );

            if (base != null) {
                List<AuditDto.AuditCarbonLinkDto> links = getLinkedCarbonData(id);
                return Optional.of(new AuditDto(
                        base.id(), base.organizationId(), base.auditName(), base.auditPeriod(),
                        base.auditType(), base.scope(), base.leadAuditor(), base.startDate(),
                        base.dueDate(), base.status(), base.description(), base.completionNotes(),
                        base.closedAt(), base.createdBy(), base.createdAt(), base.updatedAt(), links
                ));
            }
            return Optional.empty();
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<AuditDto> searchAndFilter(String organizationId, String period, String status, String query, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT id, organization_id, audit_name, audit_period, audit_type, scope,
                       lead_auditor, start_date, due_date, status, description, completion_notes,
                       closed_at, created_by, created_at, updated_at
                FROM audits
                WHERE organization_id = :orgId
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 50)
                .addValue("offset", Math.max(offset, 0));

        if (period != null && !period.isBlank() && !period.equalsIgnoreCase("ALL")) {
            sql.append(" AND audit_period = :period ");
            params.addValue("period", period);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = :status ");
            params.addValue("status", status);
        }
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(audit_name) LIKE :q OR LOWER(lead_auditor) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        sql.append(" ORDER BY start_date DESC LIMIT :limit OFFSET :offset ");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> new AuditDto(
                rs.getString("id"),
                rs.getString("organization_id"),
                rs.getString("audit_name"),
                rs.getString("audit_period"),
                rs.getString("audit_type"),
                rs.getString("scope"),
                rs.getString("lead_auditor"),
                rs.getDate("start_date") != null ? rs.getDate("start_date").toLocalDate() : null,
                rs.getDate("due_date") != null ? rs.getDate("due_date").toLocalDate() : null,
                rs.getString("status"),
                rs.getString("description"),
                rs.getString("completion_notes"),
                rs.getTimestamp("closed_at") != null ? rs.getTimestamp("closed_at").toLocalDateTime() : null,
                rs.getString("created_by"),
                rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
                rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null,
                List.of()
        ));
    }

    public List<AuditDto.AuditCarbonLinkDto> getLinkedCarbonData(String auditId) {
        String sql = """
                SELECT ac.id, ac.audit_id, ac.carbon_data_id, ac.status, ac.reviewer_id,
                       ac.reviewer_comments, ac.reviewed_at,
                       c.scope, c.category, c.activity_type, c.calculated_emissions
                FROM audit_carbon_data ac
                JOIN carbon_data c ON ac.carbon_data_id = c.id
                WHERE ac.audit_id = :auditId
                """;
        return jdbcTemplate.query(sql, new MapSqlParameterSource("auditId", auditId), (rs, rowNum) ->
                new AuditDto.AuditCarbonLinkDto(
                        rs.getString("id"),
                        rs.getString("audit_id"),
                        rs.getString("carbon_data_id"),
                        rs.getString("scope"),
                        rs.getString("category"),
                        rs.getString("activity_type"),
                        rs.getDouble("calculated_emissions"),
                        rs.getString("status"),
                        rs.getString("reviewer_id"),
                        rs.getString("reviewer_comments"),
                        rs.getTimestamp("reviewed_at") != null ? rs.getTimestamp("reviewed_at").toLocalDateTime() : null
                )
        );
    }

    public void insert(AuditDto dto) {
        String sql = """
                INSERT INTO audits (id, organization_id, audit_name, audit_period, audit_type, scope,
                                    lead_auditor, start_date, due_date, status, description, completion_notes,
                                    closed_at, created_by, created_at, updated_at)
                VALUES (:id, :orgId, :name, :period, :type, :scope, :auditor, :startDate, :dueDate,
                        :status, :description, :completionNotes, :closedAt, :createdBy, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("name", dto.auditName())
                .addValue("period", dto.auditPeriod())
                .addValue("type", dto.auditType())
                .addValue("scope", dto.scope())
                .addValue("auditor", dto.leadAuditor())
                .addValue("startDate", Date.valueOf(dto.startDate()))
                .addValue("dueDate", Date.valueOf(dto.dueDate()))
                .addValue("status", dto.status() != null ? dto.status() : "DRAFT")
                .addValue("description", dto.description())
                .addValue("completionNotes", dto.completionNotes())
                .addValue("closedAt", dto.closedAt() != null ? Timestamp.valueOf(dto.closedAt()) : null)
                .addValue("createdBy", dto.createdBy())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void update(AuditDto dto) {
        String sql = """
                UPDATE audits
                SET audit_name = :name, audit_period = :period, audit_type = :type, scope = :scope,
                    lead_auditor = :auditor, start_date = :startDate, due_date = :dueDate,
                    status = :status, description = :description, completion_notes = :completionNotes,
                    closed_at = :closedAt, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("name", dto.auditName())
                .addValue("period", dto.auditPeriod())
                .addValue("type", dto.auditType())
                .addValue("scope", dto.scope())
                .addValue("auditor", dto.leadAuditor())
                .addValue("startDate", Date.valueOf(dto.startDate()))
                .addValue("dueDate", Date.valueOf(dto.dueDate()))
                .addValue("status", dto.status())
                .addValue("description", dto.description())
                .addValue("completionNotes", dto.completionNotes())
                .addValue("closedAt", dto.closedAt() != null ? Timestamp.valueOf(dto.closedAt()) : null)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void linkCarbonData(String auditId, String carbonDataId) {
        String sql = """
                INSERT INTO audit_carbon_data (id, audit_id, carbon_data_id, status)
                VALUES (:id, :auditId, :carbonDataId, 'PENDING')
                ON CONFLICT (audit_id, carbon_data_id) DO NOTHING
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID().toString())
                .addValue("auditId", auditId)
                .addValue("carbonDataId", carbonDataId);
        jdbcTemplate.update(sql, params);
    }

    public void validateCarbonItem(String auditId, String carbonDataId, String status, String reviewerId, String comments) {
        String sql = """
                UPDATE audit_carbon_data
                SET status = :status, reviewer_id = :reviewerId, reviewer_comments = :comments, reviewed_at = :reviewedAt
                WHERE audit_id = :auditId AND carbon_data_id = :carbonDataId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("status", status)
                .addValue("reviewerId", reviewerId)
                .addValue("comments", comments)
                .addValue("reviewedAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("auditId", auditId)
                .addValue("carbonDataId", carbonDataId);

        jdbcTemplate.update(sql, params);

        // Also sync carbon_data table status if validated
        if ("VALIDATED".equals(status)) {
            jdbcTemplate.update("UPDATE carbon_data SET status = 'VALIDATED', updated_at = :now WHERE id = :id",
                    new MapSqlParameterSource("now", Timestamp.valueOf(LocalDateTime.now())).addValue("id", carbonDataId));
        } else if ("REJECTED".equals(status) || "NEEDS_REVIEW".equals(status)) {
            jdbcTemplate.update("UPDATE carbon_data SET status = 'FLAGGED', updated_at = :now WHERE id = :id",
                    new MapSqlParameterSource("now", Timestamp.valueOf(LocalDateTime.now())).addValue("id", carbonDataId));
        }
    }
}
