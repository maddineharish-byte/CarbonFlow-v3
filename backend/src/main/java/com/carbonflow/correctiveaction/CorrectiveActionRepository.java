package com.carbonflow.correctiveaction;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class CorrectiveActionRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public CorrectiveActionRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<CorrectiveActionDto> ROW_MAPPER = (rs, rowNum) -> {
        LocalDate dueDate = rs.getDate("due_date") != null ? rs.getDate("due_date").toLocalDate() : null;
        String status = rs.getString("status");
        boolean overdue = dueDate != null && dueDate.isBefore(LocalDate.now()) &&
                !"COMPLETED".equalsIgnoreCase(status) && !"VERIFIED".equalsIgnoreCase(status) && !"CLOSED".equalsIgnoreCase(status);

        return new CorrectiveActionDto(
                rs.getString("id"),
                rs.getString("organization_id"),
                rs.getString("finding_id"),
                rs.getString("finding_title"),
                rs.getString("finding_severity"),
                rs.getString("action_title"),
                rs.getString("description"),
                rs.getString("owner_id"),
                rs.getString("owner_name"),
                rs.getString("priority"),
                dueDate,
                status,
                rs.getTimestamp("completion_date") != null ? rs.getTimestamp("completion_date").toLocalDateTime() : null,
                rs.getString("completion_notes"),
                rs.getString("completion_evidence_id"),
                overdue,
                rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
                rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
        );
    };

    public Optional<CorrectiveActionDto> findByIdAndOrg(String id, String organizationId) {
        String sql = """
                SELECT ca.id, ca.organization_id, ca.finding_id, f.title as finding_title,
                       f.severity as finding_severity, ca.action_title, ca.description,
                       ca.owner_id, u.full_name as owner_name, ca.priority, ca.due_date,
                       ca.status, ca.completion_date, ca.completion_notes, ca.completion_evidence_id,
                       ca.created_at, ca.updated_at
                FROM corrective_actions ca
                JOIN findings f ON ca.finding_id = f.id
                JOIN users u ON ca.owner_id = u.id
                WHERE ca.id = :id AND ca.organization_id = :orgId
                """;
        try {
            CorrectiveActionDto dto = jdbcTemplate.queryForObject(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId), ROW_MAPPER);
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<CorrectiveActionDto> searchAndFilter(String organizationId, String findingId, String priority, String status, String ownerId, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT ca.id, ca.organization_id, ca.finding_id, f.title as finding_title,
                       f.severity as finding_severity, ca.action_title, ca.description,
                       ca.owner_id, u.full_name as owner_name, ca.priority, ca.due_date,
                       ca.status, ca.completion_date, ca.completion_notes, ca.completion_evidence_id,
                       ca.created_at, ca.updated_at
                FROM corrective_actions ca
                JOIN findings f ON ca.finding_id = f.id
                JOIN users u ON ca.owner_id = u.id
                WHERE ca.organization_id = :orgId
                """);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", organizationId)
                .addValue("limit", limit > 0 ? limit : 50)
                .addValue("offset", Math.max(offset, 0));

        if (findingId != null && !findingId.isBlank() && !findingId.equalsIgnoreCase("ALL")) {
            sql.append(" AND ca.finding_id = :findingId ");
            params.addValue("findingId", findingId);
        }
        if (priority != null && !priority.isBlank() && !priority.equalsIgnoreCase("ALL")) {
            sql.append(" AND ca.priority = :priority ");
            params.addValue("priority", priority);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND ca.status = :status ");
            params.addValue("status", status);
        }
        if (ownerId != null && !ownerId.isBlank() && !ownerId.equalsIgnoreCase("ALL")) {
            sql.append(" AND ca.owner_id = :ownerId ");
            params.addValue("ownerId", ownerId);
        }

        sql.append(" ORDER BY ca.due_date ASC, ca.created_at DESC LIMIT :limit OFFSET :offset ");
        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }

    public void insert(CorrectiveActionDto dto) {
        String sql = """
                INSERT INTO corrective_actions (id, organization_id, finding_id, action_title,
                                                description, owner_id, priority, due_date, status,
                                                completion_date, completion_notes, completion_evidence_id,
                                                created_at, updated_at)
                VALUES (:id, :orgId, :findingId, :title, :description, :ownerId, :priority, :dueDate,
                        :status, :compDate, :compNotes, :compEvidenceId, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("findingId", dto.findingId())
                .addValue("title", dto.actionTitle())
                .addValue("description", dto.description())
                .addValue("ownerId", dto.ownerId())
                .addValue("priority", dto.priority())
                .addValue("dueDate", Date.valueOf(dto.dueDate()))
                .addValue("status", dto.status() != null ? dto.status() : "OPEN")
                .addValue("compDate", dto.completionDate() != null ? Timestamp.valueOf(dto.completionDate()) : null)
                .addValue("compNotes", dto.completionNotes())
                .addValue("compEvidenceId", dto.completionEvidenceId())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void update(CorrectiveActionDto dto) {
        String sql = """
                UPDATE corrective_actions
                SET action_title = :title, description = :description, owner_id = :ownerId,
                    priority = :priority, due_date = :dueDate, status = :status,
                    completion_date = :compDate, completion_notes = :compNotes,
                    completion_evidence_id = :compEvidenceId, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("title", dto.actionTitle())
                .addValue("description", dto.description())
                .addValue("ownerId", dto.ownerId())
                .addValue("priority", dto.priority())
                .addValue("dueDate", Date.valueOf(dto.dueDate()))
                .addValue("status", dto.status())
                .addValue("compDate", dto.completionDate() != null ? Timestamp.valueOf(dto.completionDate()) : null)
                .addValue("compNotes", dto.completionNotes())
                .addValue("compEvidenceId", dto.completionEvidenceId())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void delete(String id, String organizationId) {
        String sql = "DELETE FROM corrective_actions WHERE id = :id AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId));
    }
}
