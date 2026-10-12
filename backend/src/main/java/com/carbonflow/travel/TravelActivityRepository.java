package com.carbonflow.travel;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class TravelActivityRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public TravelActivityRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<TravelActivityDto> ROW_MAPPER = (rs, rowNum) -> new TravelActivityDto(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("user_id"),
            rs.getString("user_full_name"),
            rs.getString("title"),
            rs.getDate("travel_date") != null ? rs.getDate("travel_date").toLocalDate() : null,
            TripType.valueOf(rs.getString("trip_type")),
            TravelMode.valueOf(rs.getString("travel_mode")),
            rs.getString("vehicle_type"),
            rs.getString("origin_address"),
            rs.getString("destination_address"),
            rs.getString("waypoints_json"),
            rs.getInt("passenger_count"),
            rs.getDouble("one_way_distance_km"),
            rs.getDouble("total_distance_km"),
            rs.getInt("duration_seconds"),
            rs.getString("routing_provider"),
            rs.getString("routing_service"),
            rs.getTimestamp("route_calculated_at") != null ? rs.getTimestamp("route_calculated_at").toLocalDateTime() : null,
            rs.getString("route_summary"),
            rs.getString("emission_factor_id"),
            rs.getObject("emission_factor_value") != null ? rs.getDouble("emission_factor_value") : null,
            rs.getObject("calculated_emissions") != null ? rs.getDouble("calculated_emissions") : null,
            rs.getString("carbon_data_id"),
            rs.getString("status"),
            rs.getString("notes"),
            rs.getString("provenance_metadata"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public void insert(TravelActivityDto dto) {
        String sql = """
                INSERT INTO travel_activities (
                    id, organization_id, user_id, title, travel_date, trip_type, travel_mode, vehicle_type,
                    origin_address, destination_address, waypoints_json, passenger_count, one_way_distance_km,
                    total_distance_km, duration_seconds, routing_provider, routing_service, route_calculated_at,
                    route_summary, emission_factor_id, emission_factor_value, calculated_emissions, carbon_data_id,
                    status, notes, provenance_metadata, created_at, updated_at
                ) VALUES (
                    :id, :orgId, :userId, :title, :travelDate, :tripType, :travelMode, :vehicleType,
                    :origin, :destination, :waypoints, :passengers, :oneWayKm, :totalKm, :durationSec,
                    :provider, :service, :routeCalculatedAt, :routeSummary, :factorId, :factorVal, :emissions,
                    :carbonDataId, :status, :notes, :provenance, :createdAt, :updatedAt
                )
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", dto.id())
                .addValue("orgId", dto.organizationId())
                .addValue("userId", dto.userId())
                .addValue("title", dto.title())
                .addValue("travelDate", Date.valueOf(dto.travelDate()))
                .addValue("tripType", dto.tripType().name())
                .addValue("travelMode", dto.travelMode().name())
                .addValue("vehicleType", dto.vehicleType())
                .addValue("origin", dto.originAddress())
                .addValue("destination", dto.destinationAddress())
                .addValue("waypoints", dto.waypointsJson())
                .addValue("passengers", dto.passengerCount())
                .addValue("oneWayKm", dto.oneWayDistanceKm())
                .addValue("totalKm", dto.totalDistanceKm())
                .addValue("durationSec", dto.durationSeconds())
                .addValue("provider", dto.routingProvider())
                .addValue("service", dto.routingService())
                .addValue("routeCalculatedAt", Timestamp.valueOf(dto.routeCalculatedAt()))
                .addValue("routeSummary", dto.routeSummary())
                .addValue("factorId", dto.emissionFactorId())
                .addValue("factorVal", dto.emissionFactorValue())
                .addValue("emissions", dto.calculatedEmissions())
                .addValue("carbonDataId", dto.carbonDataId())
                .addValue("status", dto.status())
                .addValue("notes", dto.notes())
                .addValue("provenance", dto.provenanceMetadata())
                .addValue("createdAt", Timestamp.valueOf(dto.createdAt()))
                .addValue("updatedAt", Timestamp.valueOf(dto.updatedAt()));

        jdbcTemplate.update(sql, params);
    }

    public Optional<TravelActivityDto> findByIdAndOrg(String id, String orgId) {
        String sql = """
                SELECT t.*, u.full_name as user_full_name
                FROM travel_activities t
                JOIN users u ON t.user_id = u.id
                WHERE t.id = :id AND t.organization_id = :orgId
                """;
        try {
            TravelActivityDto dto = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("id", id).addValue("orgId", orgId),
                    ROW_MAPPER
            );
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<TravelActivityDto> findAllByOrg(String orgId, String userId, String status, String travelMode, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
                SELECT t.*, u.full_name as user_full_name
                FROM travel_activities t
                JOIN users u ON t.user_id = u.id
                WHERE t.organization_id = :orgId
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("orgId", orgId);

        if (userId != null && !userId.isBlank()) {
            sql.append(" AND t.user_id = :userId");
            params.addValue("userId", userId);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND t.status = :status");
            params.addValue("status", status.toUpperCase());
        }
        if (travelMode != null && !travelMode.isBlank() && !travelMode.equalsIgnoreCase("ALL")) {
            sql.append(" AND t.travel_mode = :travelMode");
            params.addValue("travelMode", travelMode.toUpperCase());
        }

        sql.append(" ORDER BY t.travel_date DESC, t.created_at DESC LIMIT :limit OFFSET :offset");
        params.addValue("limit", limit > 0 ? limit : 50);
        params.addValue("offset", Math.max(0, offset));

        return jdbcTemplate.query(sql.toString(), params, ROW_MAPPER);
    }

    public int countByOrg(String orgId, String userId, String status, String travelMode) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM travel_activities WHERE organization_id = :orgId");
        MapSqlParameterSource params = new MapSqlParameterSource("orgId", orgId);

        if (userId != null && !userId.isBlank()) {
            sql.append(" AND user_id = :userId");
            params.addValue("userId", userId);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = :status");
            params.addValue("status", status.toUpperCase());
        }
        if (travelMode != null && !travelMode.isBlank() && !travelMode.equalsIgnoreCase("ALL")) {
            sql.append(" AND travel_mode = :travelMode");
            params.addValue("travelMode", travelMode.toUpperCase());
        }

        Integer count = jdbcTemplate.queryForObject(sql.toString(), params, Integer.class);
        return count != null ? count : 0;
    }

    public void updateCarbonLink(String travelId, String orgId, String carbonDataId, double emissions, String status) {
        String sql = """
                UPDATE travel_activities
                SET carbon_data_id = :carbonDataId,
                    calculated_emissions = :emissions,
                    status = :status,
                    updated_at = :updatedAt
                WHERE id = :id AND organization_id = :orgId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", travelId)
                .addValue("orgId", orgId)
                .addValue("carbonDataId", carbonDataId)
                .addValue("emissions", emissions)
                .addValue("status", status)
                .addValue("updatedAt", Timestamp.valueOf(java.time.LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    public void delete(String id, String orgId) {
        String sql = "DELETE FROM travel_activities WHERE id = :id AND organization_id = :orgId";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id).addValue("orgId", orgId));
    }
}
