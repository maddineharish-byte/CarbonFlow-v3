package com.carbonflow.finding;

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
public class FindingRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public FindingRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<FindingDto> ROW_MAPPER = (rs, rowNum) -> new FindingDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("audit_id"),
            rs.getString("audit_name"),
            rs.getString("title"),
            rs.getString("description"),
            rs.getString("severity"),
            rs.getString("source"),
            rs.getString("related_carbon_data_id"),
            rs.getString("related_evidence_id"),
            rs.getString("owner_id"),
            rs.getString("owner_name"),
            rs.getString("status"),
            rs.getDate("due_date") != null ? rs.getDate("due_date").toLocalDate() : null,
            rs.getTimestamp("resolution_date") != null ? rs.getTimestamp("resolution_date").toLocalDateTime() : null,
            rs.getString("resolution_notes"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public Optional<FindingDto> findByIdAndOrg(String id, String organizationId) {
        String sql = """
                SELECT f.id, f.organization_id, f.audit_id, a.audit_name, f.title, f.description,
                       f.severity, f.source, f.related_carbon_data_id, f.related_evidence_id,
                       f.owner_id, u.full_name as owner_name, f.status, f.due_date,
                       f.resolution_date, f.resolution_notes, f.created_at, f.updated_at
                FROM findings f
                JOIN audits a ON f.audit_id = a.id
                JOIN users u ON f.owner_id = u.id
                WHERE f.id = :id AND f.organization_id = :orgId
                """;
        try {
            FindingDto dto = jdbcTemplate.queryForObject(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId), ROW_MAPPER);
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<FindingDto> searchAndFilter(String organizationId, String auditId, String severity, String status, String query, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT f.id, f.organization_id, f.audit_id, a.audit_name, f.title, f.description,
                       f.severity, f.source, f.related_carbon_data_id, f.related_evidence_id,
                       f.owner_id, u.full_name as owner_name, f.status, f.due_date,
                       f.resolution_date, f.resolution_notes, f.created_at, f.updated_at
                FROM findings f
                JOIN audits a ON f.audit_id = a.id
                JOIN users u ON f.owner_id = u.id
                WHERE f.organization_id = :orgId
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 50)
                .addValue("offset", Math.max(offset, 0));

        if (auditId != null && !auditId.isBlank() && !auditId.equalsIgnoreCase("ALL")) {
            sql.append(" AND f.audit_id = :auditId ");
            params.addValue("auditId", auditId);
        }
        if (severity != null && !severity.isBlank() && !severity.equalsIgnoreCase("ALL")) {
            sql.append(" AND f.severity = :severity ");
            params.addValue("severity", severity);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND f.status = :status ");
            params.addValue("status", status);
        }
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(f.title) LIKE :q OR LOWER(f.description) LIKE :q OR LOWER(f.source) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        sql.append(" ORDER BY f.due_date ASC, f.created_at DESC LIMIT :limit OFFSET :offset ");
        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }

    public void insert(FindingDto dto) {
        String sql = """
                INSERT INTO findings (id, organization_id, audit_id, title, description, severity,
                                      source, related_carbon_data_id, related_evidence_id, owner_id,
                                      status, due_date, resolution_date, resolution_notes, created_at, updated_at)
                VALUES (:id, :orgId, :auditId, :title, :description, :severity, :source,
                        :carbonDataId, :evidenceId, :ownerId, :status, :dueDate, :resDate,
                        :resNotes, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("auditId", dto.auditId())
                .addValue("title", dto.title())
                .addValue("description", dto.description())
                .addValue("severity", dto.severity())
                .addValue("source", dto.source())
                .addValue("carbonDataId", dto.relatedCarbonDataId())
                .addValue("evidenceId", dto.relatedEvidenceId())
                .addValue("ownerId", dto.ownerId())
                .addValue("status", dto.status() != null ? dto.status() : "OPEN")
                .addValue("dueDate", Date.valueOf(dto.dueDate()))
                .addValue("resDate", dto.resolutionDate() != null ? Timestamp.valueOf(dto.resolutionDate()) : null)
                .addValue("resNotes", dto.resolutionNotes())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void update(FindingDto dto) {
        String sql = """
                UPDATE findings
                SET title = :title, description = :description, severity = :severity, source = :source,
                    related_carbon_data_id = :carbonDataId, related_evidence_id = :evidenceId,
                    owner_id = :ownerId, status = :status, due_date = :dueDate,
                    resolution_date = :resDate, resolution_notes = :resNotes, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("title", dto.title())
                .addValue("description", dto.description())
                .addValue("severity", dto.severity())
                .addValue("source", dto.source())
                .addValue("carbonDataId", dto.relatedCarbonDataId())
                .addValue("evidenceId", dto.relatedEvidenceId())
                .addValue("ownerId", dto.ownerId())
                .addValue("status", dto.status())
                .addValue("dueDate", Date.valueOf(dto.dueDate()))
                .addValue("resDate", dto.resolutionDate() != null ? Timestamp.valueOf(dto.resolutionDate()) : null)
                .addValue("resNotes", dto.resolutionNotes())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void delete(String id, String organizationId) {
        String sql = "DELETE FROM findings WHERE id = :id AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId));
    }
}
