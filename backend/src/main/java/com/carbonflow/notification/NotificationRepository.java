package com.carbonflow.notification;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class NotificationRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public NotificationRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<NotificationDto> ROW_MAPPER = (rs, rowNum) -> new NotificationDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("user_id"),
            rs.getString("title"),
            rs.getString("message"),
            rs.getString("type"),
            rs.getString("reference_entity_type"),
            rs.getString("reference_entity_id"),
            rs.getBoolean("is_read"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
    );

    public List<NotificationDto> findForUser(String userId, String organizationId, int limit) {
        String sql = """
                SELECT id, organization_id, user_id, title, message, type,
                       reference_entity_type, reference_entity_id, is_read, created_at
                FROM notifications
                WHERE (user_id = :userId OR user_id IS NULL) AND organization_id = :orgId
                ORDER BY created_at DESC
                LIMIT :limit
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 20);
        return jdbcTemplate.query(sql, params, ROW_MAPPER);
    }

    public int getUnreadCount(String userId, String organizationId) {
        String sql = """
                SELECT COUNT(*)
                FROM notifications
                WHERE (user_id = :userId OR user_id IS NULL) AND organization_id = :orgId AND is_read = FALSE
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("orgId", organizationId);
        Integer count = jdbcTemplate.queryForObject(sql, params, Integer.class);
        return count != null ? count : 0;
    }

    public void markAsRead(String notificationId, String userId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = :id AND (user_id = :userId OR user_id IS NULL)";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", notificationId).addValue("userId", userId));
    }

    public void markAllAsRead(String userId, String organizationId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE (user_id = :userId OR user_id IS NULL) AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("userId", userId).addValue("orgId", organizationId));
    }

    public void create(String orgId, String userId, String title, String message, String type, String refType, String refId) {
        String sql = """
                INSERT INTO notifications (id, organization_id, user_id, title, message, type, reference_entity_type, reference_entity_id, is_read, created_at)
                VALUES (:id, :orgId, :userId, :title, :message, :type, :refType, :refId, FALSE, :createdAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID().toString())
                .addValue("orgId", orgId)
                .addValue("userId", userId)
                .addValue("title", title)
                .addValue("message", message)
                .addValue("type", type)
                .addValue("refType", refType)
                .addValue("refId", refId)
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }
}
