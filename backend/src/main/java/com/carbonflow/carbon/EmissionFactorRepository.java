package com.carbonflow.carbon;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class EmissionFactorRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public EmissionFactorRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<EmissionFactorDto> ROW_MAPPER = (rs, rowNum) -> new EmissionFactorDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("category"),
            rs.getString("activity_type"),
            rs.getString("scope"),
            rs.getString("unit"),
            rs.getDouble("factor_value"),
            rs.getString("factor_unit"),
            rs.getString("source_reference"),
            rs.getInt("factor_year")
    );

    public List<EmissionFactorDto> findAllForOrganization(String organizationId) {
        String sql = """
                SELECT id, organization_id, category, activity_type, scope, unit, factor_value, factor_unit, source_reference, factor_year
                FROM emission_factors
                WHERE organization_id IS NULL OR organization_id = :orgId
                ORDER BY scope, category, activity_type
                """;
        return jdbcTemplate.query(sql, new MapSqlParameterSource("orgId", organizationId), ROW_MAPPER);
    }
}
