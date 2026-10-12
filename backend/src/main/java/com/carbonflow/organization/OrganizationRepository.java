package com.carbonflow.organization;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class OrganizationRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public OrganizationRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<OrganizationDto> ROW_MAPPER = (rs, rowNum) -> new OrganizationDto(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("industry"),
            rs.getString("country"),
            rs.getString("location"),
            rs.getString("description"),
            rs.getString("reporting_period"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public Optional<OrganizationDto> findById(String id) {
        String sql = "SELECT id, name, industry, country, location, description, reporting_period, created_at, updated_at FROM organizations WHERE id = :id";
        try {
            OrganizationDto org = jdbcTemplate.queryForObject(sql, new MapSqlParameterSource("id", id), ROW_MAPPER);
            return Optional.ofNullable(org);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void update(OrganizationDto org) {
        String sql = """
                UPDATE organizations
                SET name = :name, industry = :industry, country = :country, location = :location,
                    description = :description, reporting_period = :reportingPeriod, updated_at = :updatedAt
                WHERE id = :id
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", org.id())
                .addValue("name", org.name())
                .addValue("industry", org.industry())
                .addValue("country", org.country())
                .addValue("location", org.location())
                .addValue("description", org.description())
                .addValue("reportingPeriod", org.reportingPeriod())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }

    public void create(OrganizationDto org) {
        String sql = """
                INSERT INTO organizations (id, name, industry, country, location, description, reporting_period, created_at, updated_at)
                VALUES (:id, :name, :industry, :country, :location, :description, :reportingPeriod, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", org.id())
                .addValue("name", org.name())
                .addValue("industry", org.industry())
                .addValue("country", org.country())
                .addValue("location", org.location())
                .addValue("description", org.description())
                .addValue("reportingPeriod", org.reportingPeriod() != null ? org.reportingPeriod() : "2025")
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));

        jdbcTemplate.update(sql, params);
    }
}
