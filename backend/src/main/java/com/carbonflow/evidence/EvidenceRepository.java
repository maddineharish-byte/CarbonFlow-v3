package com.carbonflow.evidence;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class EvidenceRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public EvidenceRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<EvidenceDto> ROW_MAPPER = (rs, rowNum) -> new EvidenceDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("evidence_name"),
            rs.getString("evidence_type"),
            rs.getString("reporting_period"),
            rs.getString("source"),
            rs.getString("owner"),
            rs.getTimestamp("upload_date") != null ? rs.getTimestamp("upload_date").toLocalDateTime() : null,
            rs.getString("status"),
            rs.getString("description"),
            rs.getString("file_url"),
            rs.getLong("file_size_bytes"),
            rs.getString("mime_type"),
            rs.getString("linked_carbon_data_id"),
            rs.getString("linked_audit_id"),
            rs.getString("verified_by"),
            rs.getTimestamp("verified_at") != null ? rs.getTimestamp("verified_at").toLocalDateTime() : null,
            rs.getString("verification_notes"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public Optional<EvidenceDto> findByIdAndOrg(String id, String organizationId) {
        String sql = """
                SELECT id, organization_id, evidence_name, evidence_type, reporting_period, source,
                       owner, upload_date, status, description, file_url, file_size_bytes, mime_type,
                       linked_carbon_data_id, linked_audit_id, verified_by, verified_at, verification_notes,
                       created_at, updated_at
                FROM evidence
                WHERE id = :id AND organization_id = :orgId
                """;
        try {
            EvidenceDto dto = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("id", id).addValue("orgId", organizationId),
                    ROW_MAPPER
            );
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<EvidenceDto> searchAndFilter(String organizationId, String period, String status, String type, String query, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT id, organization_id, evidence_name, evidence_type, reporting_period, source,
                       owner, upload_date, status, description, file_url, file_size_bytes, mime_type,
                       linked_carbon_data_id, linked_audit_id, verified_by, verified_at, verification_notes,
                       created_at, updated_at
                FROM evidence
                WHERE organization_id = :orgId
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 50)
                .addValue("offset", Math.max(offset, 0));

        if (period != null && !period.isBlank() && !period.equalsIgnoreCase("ALL")) {
            sql.append(" AND reporting_period = :period ");
            params.addValue("period", period);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = :status ");
            params.addValue("status", status);
        }
        if (type != null && !type.isBlank() && !type.equalsIgnoreCase("ALL")) {
            sql.append(" AND evidence_type = :type ");
            params.addValue("type", type);
        }
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(evidence_name) LIKE :q OR LOWER(source) LIKE :q OR LOWER(owner) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        sql.append(" ORDER BY upload_date DESC LIMIT :limit OFFSET :offset ");
        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }

    public int count(String organizationId, String period, String status, String type, String query) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM evidence WHERE organization_id = :orgId");
        MapSqlParameterSource params = new MapSqlParameterSource("orgId", organizationId);

        if (period != null && !period.isBlank() && !period.equalsIgnoreCase("ALL")) {
            sql.append(" AND reporting_period = :period ");
            params.addValue("period", period);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = :status ");
            params.addValue("status", status);
        }
        if (type != null && !type.isBlank() && !type.equalsIgnoreCase("ALL")) {
            sql.append(" AND evidence_type = :type ");
            params.addValue("type", type);
        }
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(evidence_name) LIKE :q OR LOWER(source) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        Integer count = jdbcTemplate.queryForObject(sql.toString(), params, Integer.class);
        return count != null ? count : 0;
    }

    public void insert(EvidenceDto dto) {
        String sql = """
                INSERT INTO evidence (id, organization_id, evidence_name, evidence_type, reporting_period,
                                      source, owner, upload_date, status, description, file_url, file_size_bytes,
                                      mime_type, linked_carbon_data_id, linked_audit_id, created_at, updated_at)
                VALUES (:id, :orgId, :name, :type, :period, :source, :owner, :uploadDate, :status,
                        :description, :fileUrl, :fileSize, :mimeType, :carbonDataId, :auditId, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("name", dto.evidenceName())
                .addValue("type", dto.evidenceType())
                .addValue("period", dto.reportingPeriod())
                .addValue("source", dto.source())
                .addValue("owner", dto.owner())
                .addValue("uploadDate", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("status", dto.status() != null ? dto.status() : "PENDING")
                .addValue("description", dto.description())
                .addValue("fileUrl", dto.fileUrl())
                .addValue("fileSize", dto.fileSizeBytes())
                .addValue("mimeType", dto.mimeType())
                .addValue("carbonDataId", dto.linkedCarbonDataId())
                .addValue("auditId", dto.linkedAuditId())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void update(EvidenceDto dto) {
        String sql = """
                UPDATE evidence
                SET evidence_name = :name, evidence_type = :type, reporting_period = :period, source = :source,
                    owner = :owner, description = :description, linked_carbon_data_id = :carbonDataId,
                    linked_audit_id = :auditId, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("name", dto.evidenceName())
                .addValue("type", dto.evidenceType())
                .addValue("period", dto.reportingPeriod())
                .addValue("source", dto.source())
                .addValue("owner", dto.owner())
                .addValue("description", dto.description())
                .addValue("carbonDataId", dto.linkedCarbonDataId())
                .addValue("auditId", dto.linkedAuditId())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void updateVerification(String id, String organizationId, String status, String verifiedBy, String notes) {
        String sql = """
                UPDATE evidence
                SET status = :status, verified_by = :verifiedBy, verified_at = :verifiedAt,
                    verification_notes = :notes, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("orgId", organizationId)
                .addValue("status", status)
                .addValue("verifiedBy", verifiedBy)
                .addValue("verifiedAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("notes", notes)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void delete(String id, String organizationId) {
        String sql = "DELETE FROM evidence WHERE id = :id AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId));
    }
}
