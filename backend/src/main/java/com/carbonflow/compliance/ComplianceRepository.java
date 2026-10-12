package com.carbonflow.compliance;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ComplianceRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ComplianceRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<ComplianceDto> ROW_MAPPER = (rs, rowNum) -> new ComplianceDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("requirement_code"),
            rs.getString("framework"),
            rs.getString("requirement_name"),
            rs.getString("description"),
            rs.getString("applicability"),
            rs.getString("owner_id"),
            rs.getString("owner_name"),
            rs.getString("status"),
            rs.getDate("due_date") != null ? rs.getDate("due_date").toLocalDate() : null,
            rs.getString("linked_evidence_id"),
            rs.getString("evidence_name"),
            rs.getString("linked_audit_id"),
            rs.getString("audit_name"),
            rs.getString("notes"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public Optional<ComplianceDto> findByIdAndOrg(String id, String organizationId) {
        String sql = """
                SELECT c.id, c.organization_id, c.requirement_code, c.framework, c.requirement_name,
                       c.description, c.applicability, c.owner_id, u.full_name as owner_name, c.status,
                       c.due_date, c.linked_evidence_id, e.evidence_name, c.linked_audit_id, a.audit_name,
                       c.notes, c.created_at, c.updated_at
                FROM compliance_requirements c
                JOIN users u ON c.owner_id = u.id
                LEFT JOIN evidence e ON c.linked_evidence_id = e.id
                LEFT JOIN audits a ON c.linked_audit_id = a.id
                WHERE c.id = :id AND c.organization_id = :orgId
                """;
        try {
            ComplianceDto dto = jdbcTemplate.queryForObject(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId), ROW_MAPPER);
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<ComplianceDto> searchAndFilter(String organizationId, String framework, String status, String query, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT c.id, c.organization_id, c.requirement_code, c.framework, c.requirement_name,
                       c.description, c.applicability, c.owner_id, u.full_name as owner_name, c.status,
                       c.due_date, c.linked_evidence_id, e.evidence_name, c.linked_audit_id, a.audit_name,
                       c.notes, c.created_at, c.updated_at
                FROM compliance_requirements c
                JOIN users u ON c.owner_id = u.id
                LEFT JOIN evidence e ON c.linked_evidence_id = e.id
                LEFT JOIN audits a ON c.linked_audit_id = a.id
                WHERE c.organization_id = :orgId
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 50)
                .addValue("offset", Math.max(offset, 0));

        if (framework != null && !framework.isBlank() && !framework.equalsIgnoreCase("ALL")) {
            sql.append(" AND c.framework = :framework ");
            params.addValue("framework", framework);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND c.status = :status ");
            params.addValue("status", status);
        }
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(c.requirement_name) LIKE :q OR LOWER(c.requirement_code) LIKE :q OR LOWER(c.description) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        sql.append(" ORDER BY c.framework ASC, c.requirement_code ASC LIMIT :limit OFFSET :offset ");
        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }

    public void insert(ComplianceDto dto) {
        String sql = """
                INSERT INTO compliance_requirements (id, organization_id, requirement_code, framework,
                                                     requirement_name, description, applicability, owner_id,
                                                     status, due_date, linked_evidence_id, linked_audit_id,
                                                     notes, created_at, updated_at)
                VALUES (:id, :orgId, :code, :framework, :name, :description, :applicability, :ownerId,
                        :status, :dueDate, :evidenceId, :auditId, :notes, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("code", dto.requirementCode())
                .addValue("framework", dto.framework())
                .addValue("name", dto.requirementName())
                .addValue("description", dto.description())
                .addValue("applicability", dto.applicability())
                .addValue("ownerId", dto.ownerId())
                .addValue("status", dto.status() != null ? dto.status() : "IN_PROGRESS")
                .addValue("dueDate", dto.dueDate() != null ? Date.valueOf(dto.dueDate()) : null)
                .addValue("evidenceId", dto.linkedEvidenceId())
                .addValue("auditId", dto.linkedAuditId())
                .addValue("notes", dto.notes())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void update(ComplianceDto dto) {
        String sql = """
                UPDATE compliance_requirements
                SET requirement_code = :code, framework = :framework, requirement_name = :name,
                    description = :description, applicability = :applicability, owner_id = :ownerId,
                    status = :status, due_date = :dueDate, linked_evidence_id = :evidenceId,
                    linked_audit_id = :auditId, notes = :notes, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("code", dto.requirementCode())
                .addValue("framework", dto.framework())
                .addValue("name", dto.requirementName())
                .addValue("description", dto.description())
                .addValue("applicability", dto.applicability())
                .addValue("ownerId", dto.ownerId())
                .addValue("status", dto.status())
                .addValue("dueDate", dto.dueDate() != null ? Date.valueOf(dto.dueDate()) : null)
                .addValue("evidenceId", dto.linkedEvidenceId())
                .addValue("auditId", dto.linkedAuditId())
                .addValue("notes", dto.notes())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void delete(String id, String organizationId) {
        String sql = "DELETE FROM compliance_requirements WHERE id = :id AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId));
    }
}
