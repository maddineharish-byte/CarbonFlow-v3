package com.carbonflow.carbon;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class CarbonDataRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public CarbonDataRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<CarbonDataDto> ROW_MAPPER = (rs, rowNum) -> new CarbonDataDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("reporting_period"),
            rs.getString("scope"),
            rs.getString("category"),
            rs.getString("activity_type"),
            rs.getDouble("activity_amount"),
            rs.getString("unit"),
            rs.getDouble("emission_factor"),
            rs.getDouble("calculated_emissions"),
            rs.getString("source"),
            rs.getString("data_owner"),
            rs.getString("status"),
            rs.getString("notes"),
            rs.getString("created_by"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public Optional<CarbonDataDto> findByIdAndOrg(String id, String organizationId) {
        String sql = """
                SELECT id, organization_id, reporting_period, scope, category, activity_type,
                       activity_amount, unit, emission_factor, calculated_emissions, source,
                       data_owner, status, notes, created_by, created_at, updated_at
                FROM carbon_data
                WHERE id = :id AND organization_id = :orgId
                """;
        try {
            CarbonDataDto dto = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("id", id).addValue("orgId", organizationId),
                    ROW_MAPPER
            );
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<CarbonDataDto> searchAndFilter(String organizationId, String period, String scope, String status, String query, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT id, organization_id, reporting_period, scope, category, activity_type,
                       activity_amount, unit, emission_factor, calculated_emissions, source,
                       data_owner, status, notes, created_by, created_at, updated_at
                FROM carbon_data
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

        if (scope != null && !scope.isBlank() && !scope.equalsIgnoreCase("ALL")) {
            sql.append(" AND scope = :scope ");
            params.addValue("scope", scope);
        }

        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = :status ");
            params.addValue("status", status);
        }

        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(category) LIKE :q OR LOWER(activity_type) LIKE :q OR LOWER(source) LIKE :q OR LOWER(data_owner) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        sql.append(" ORDER BY reporting_period DESC, scope ASC, created_at DESC LIMIT :limit OFFSET :offset ");
        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }

    public int count(String organizationId, String period, String scope, String status, String query) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM carbon_data WHERE organization_id = :orgId");
        MapSqlParameterSource params = new MapSqlParameterSource("orgId", organizationId);

        if (period != null && !period.isBlank() && !period.equalsIgnoreCase("ALL")) {
            sql.append(" AND reporting_period = :period ");
            params.addValue("period", period);
        }
        if (scope != null && !scope.isBlank() && !scope.equalsIgnoreCase("ALL")) {
            sql.append(" AND scope = :scope ");
            params.addValue("scope", scope);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = :status ");
            params.addValue("status", status);
        }
        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(category) LIKE :q OR LOWER(activity_type) LIKE :q OR LOWER(source) LIKE :q) ");
            params.addValue("q", "%" + query.toLowerCase().trim() + "%");
        }

        Integer count = jdbcTemplate.queryForObject(sql.toString(), params, Integer.class);
        return count != null ? count : 0;
    }

    public void insert(CarbonDataDto dto) {
        String sql = """
                INSERT INTO carbon_data (id, organization_id, reporting_period, scope, category, activity_type,
                                         activity_amount, unit, emission_factor, calculated_emissions, source,
                                         data_owner, status, notes, created_by, created_at, updated_at)
                VALUES (:id, :orgId, :period, :scope, :category, :activityType, :activityAmount, :unit,
                        :emissionFactor, :calculatedEmissions, :source, :dataOwner, :status, :notes,
                        :createdBy, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("period", dto.reportingPeriod())
                .addValue("scope", dto.scope())
                .addValue("category", dto.category())
                .addValue("activityType", dto.activityType())
                .addValue("activityAmount", dto.activityAmount())
                .addValue("unit", dto.unit())
                .addValue("emissionFactor", dto.emissionFactor())
                .addValue("calculatedEmissions", dto.calculatedEmissions())
                .addValue("source", dto.source())
                .addValue("dataOwner", dto.dataOwner())
                .addValue("status", dto.status())
                .addValue("notes", dto.notes())
                .addValue("createdBy", dto.createdBy())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void update(CarbonDataDto dto) {
        String sql = """
                UPDATE carbon_data
                SET reporting_period = :period, scope = :scope, category = :category, activity_type = :activityType,
                    activity_amount = :activityAmount, unit = :unit, emission_factor = :emissionFactor,
                    calculated_emissions = :calculatedEmissions, source = :source, data_owner = :dataOwner,
                    status = :status, notes = :notes, updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("period", dto.reportingPeriod())
                .addValue("scope", dto.scope())
                .addValue("category", dto.category())
                .addValue("activityType", dto.activityType())
                .addValue("activityAmount", dto.activityAmount())
                .addValue("unit", dto.unit())
                .addValue("emissionFactor", dto.emissionFactor())
                .addValue("calculatedEmissions", dto.calculatedEmissions())
                .addValue("source", dto.source())
                .addValue("dataOwner", dto.dataOwner())
                .addValue("status", dto.status())
                .addValue("notes", dto.notes())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void delete(String id, String organizationId) {
        String sql = "DELETE FROM carbon_data WHERE id = :id AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id).addValue("orgId", organizationId));
    }

    public List<Map<String, Object>> aggregateEmissionsByScope(String organizationId, String period) {
        StringBuilder sql = new StringBuilder("""
                SELECT scope,
                       COUNT(*) as record_count,
                       COALESCE(SUM(calculated_emissions), 0) as total_emissions
                FROM carbon_data
                WHERE organization_id = :orgId
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("orgId", organizationId);
        if (period != null && !period.isBlank() && !period.equalsIgnoreCase("ALL")) {
            sql.append(" AND reporting_period = :period ");
            params.addValue("period", period);
        }
        sql.append(" GROUP BY scope ORDER BY scope ASC ");
        return jdbcTemplate.queryForList(sql.toString(), params);
    }
}
