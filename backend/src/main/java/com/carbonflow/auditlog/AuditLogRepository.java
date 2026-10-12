package com.carbonflow.auditlog;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class AuditLogRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AuditLogRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<AuditLogDto> ROW_MAPPER = (rs, rowNum) -> new AuditLogDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("actor_id"),
            rs.getString("actor_name"),
            rs.getString("actor_email"),
            rs.getString("action"),
            rs.getString("entity_type"),
            rs.getString("entity_id"),
            rs.getString("metadata"),
            rs.getString("ip_address"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
    );

    public void create(String organizationId, String actorId, String actorName, String actorEmail,
                       String action, String entityType, String entityId, String metadata, String ipAddress) {
        String sql = """
                INSERT INTO audit_logs (id, organization_id, actor_id, actor_name, actor_email, action, entity_type, entity_id, metadata, ip_address, created_at)
                VALUES (:id, :orgId, :actorId, :actorName, :actorEmail, :action, :entityType, :entityId, :metadata, :ipAddress, :createdAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID().toString())
                .addValue("orgId", organizationId)
                .addValue("actorId", actorId != null ? actorId : "SYSTEM")
                .addValue("actorName", actorName != null ? actorName : "System")
                .addValue("actorEmail", actorEmail != null ? actorEmail : "system@carbonflow.io")
                .addValue("action", action)
                .addValue("entityType", entityType)
                .addValue("entityId", entityId)
                .addValue("metadata", metadata != null ? metadata : "{}")
                .addValue("ipAddress", ipAddress != null ? ipAddress : "127.0.0.1")
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public List<AuditLogDto> findByOrganization(String organizationId, String entityType, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT id, organization_id, actor_id, actor_name, actor_email, action, entity_type, entity_id, metadata, ip_address, created_at
                FROM audit_logs
                WHERE organization_id = :orgId
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 50)
                .addValue("offset", Math.max(offset, 0));

        if (entityType != null && !entityType.isBlank() && !entityType.equalsIgnoreCase("ALL")) {
            sql.append(" AND entity_type = :entityType ");
            params.addValue("entityType", entityType);
        }

        sql.append(" ORDER BY created_at DESC LIMIT :limit OFFSET :offset ");
        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }
}
