package com.carbonflow.user;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public UserRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * RowMapper to construct User entity instances from SQL result sets.
     */
    private final RowMapper<User> userRowMapper = (rs, rowNum) -> new User(
            rs.getString("id"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("full_name"),
            rs.getString("title"),
            rs.getString("phone"),
            rs.getBoolean("active"),
            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null
    );

    public record UserAuthRecord(
        String id,
        String email,
        String passwordHash,
        String fullName,
        String organizationId,
        String organizationName,
        UserRole role,
        boolean active
    ) {}

    /**
     * Find a User entity by email address from the users table.
     */
    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        String sql = """
                SELECT id, email, password_hash, full_name, title, phone, active, created_at, updated_at
                FROM users
                WHERE LOWER(email) = LOWER(:email)
                LIMIT 1
                """;
        try {
            User user = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("email", email.trim()),
                    userRowMapper
            );
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Find a User entity by primary key id.
     */
    public Optional<User> findById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        String sql = """
                SELECT id, email, password_hash, full_name, title, phone, active, created_at, updated_at
                FROM users
                WHERE id = :id
                """;
        try {
            User user = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("id", id.trim()),
                    userRowMapper
            );
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieve all users in the system.
     */
    public List<User> findAll() {
        String sql = """
                SELECT id, email, password_hash, full_name, title, phone, active, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
                """;
        return jdbcTemplate.query(sql, userRowMapper);
    }

    /**
     * Find user authentication and membership context for sign-in and token generation.
     */
    public Optional<UserAuthRecord> findAuthRecordByEmail(String email) {
        String sql = """
                SELECT u.id, u.email, u.password_hash, u.full_name, u.active,
                       m.organization_id, m.role, o.name as org_name
                FROM users u
                JOIN organization_members m ON u.id = m.user_id
                JOIN organizations o ON m.organization_id = o.id
                WHERE LOWER(u.email) = LOWER(:email) AND m.status = 'ACTIVE'
                LIMIT 1
                """;
        try {
            UserAuthRecord record = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("email", email.trim()),
                    (rs, rowNum) -> new UserAuthRecord(
                            rs.getString("id"),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            rs.getString("full_name"),
                            rs.getString("organization_id"),
                            rs.getString("org_name"),
                            UserRole.valueOf(rs.getString("role")),
                            rs.getBoolean("active")
                    )
            );
            return Optional.ofNullable(record);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieve active or associated members for a specific organization.
     */
    public List<UserDto> findMembersByOrganization(String organizationId) {
        String sql = """
                SELECT u.id, u.email, u.full_name, u.title, u.phone, u.active,
                       m.role, m.status as member_status, u.created_at
                FROM users u
                JOIN organization_members m ON u.id = m.user_id
                WHERE m.organization_id = :orgId
                ORDER BY u.created_at ASC
                """;
        return jdbcTemplate.query(
                sql,
                new MapSqlParameterSource("orgId", organizationId),
                (rs, rowNum) -> new UserDto(
                        rs.getString("id"),
                        rs.getString("email"),
                        rs.getString("full_name"),
                        rs.getString("title"),
                        rs.getString("phone"),
                        UserRole.valueOf(rs.getString("role")),
                        rs.getString("member_status"),
                        rs.getBoolean("active"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
                )
        );
    }

    /**
     * Save a User entity into the users table.
     */
    public void save(User user) {
        if (user.getId() == null) {
            user.setId(UUID.randomUUID().toString());
        }
        LocalDateTime now = LocalDateTime.now();
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(now);
        }
        if (user.getUpdatedAt() == null) {
            user.setUpdatedAt(now);
        }

        String sql = """
                INSERT INTO users (id, email, password_hash, full_name, title, phone, active, created_at, updated_at)
                VALUES (:id, :email, :passwordHash, :fullName, :title, :phone, :active, :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", user.getId())
                .addValue("email", user.getEmail().toLowerCase().trim())
                .addValue("passwordHash", user.getPasswordHash())
                .addValue("fullName", user.getFullName())
                .addValue("title", user.getTitle() != null ? user.getTitle() : "Team Member")
                .addValue("phone", user.getPhone())
                .addValue("active", user.isActive())
                .addValue("createdAt", Timestamp.valueOf(user.getCreatedAt()))
                .addValue("updatedAt", Timestamp.valueOf(user.getUpdatedAt()));
        jdbcTemplate.update(sql, params);
    }

    /**
     * Create a user with direct parameters.
     */
    public void createUser(String userId, String email, String passwordHash, String fullName, String title, String phone) {
        User user = new User(
                userId != null ? userId : UUID.randomUUID().toString(),
                email,
                passwordHash,
                fullName,
                title,
                phone,
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        save(user);
    }

    /**
     * Update an existing User entity.
     */
    public void update(User user) {
        String sql = """
                UPDATE users
                SET email = :email,
                    full_name = :fullName,
                    title = :title,
                    phone = :phone,
                    active = :active,
                    updated_at = :updatedAt
                WHERE id = :id
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", user.getId())
                .addValue("email", user.getEmail().toLowerCase().trim())
                .addValue("fullName", user.getFullName())
                .addValue("title", user.getTitle())
                .addValue("phone", user.getPhone())
                .addValue("active", user.isActive())
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    // ==========================================
    // Role & Organization Membership Management
    // ==========================================

    /**
     * Assign a role to a user within an organization.
     */
    public void assignRole(String organizationId, String userId, UserRole role) {
        addMember(organizationId, userId, role);
    }

    /**
     * Add a member with a role to an organization.
     */
    public void addMember(String orgId, String userId, UserRole role) {
        String sql = """
                INSERT INTO organization_members (id, organization_id, user_id, role, status, created_at, updated_at)
                VALUES (:id, :orgId, :userId, :role, 'ACTIVE', :createdAt, :updatedAt)
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID().toString())
                .addValue("orgId", orgId)
                .addValue("userId", userId)
                .addValue("role", role.name())
                .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now()))
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    /**
     * Update a user's role in an organization.
     */
    public void updateMemberRole(String orgId, String userId, UserRole role) {
        String sql = """
                UPDATE organization_members
                SET role = :role, updated_at = :updatedAt
                WHERE organization_id = :orgId AND user_id = :userId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("role", role.name())
                .addValue("orgId", orgId)
                .addValue("userId", userId)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    /**
     * Find a user's role in a specific organization.
     */
    public Optional<UserRole> findUserRoleInOrganization(String organizationId, String userId) {
        String sql = """
                SELECT role
                FROM organization_members
                WHERE organization_id = :orgId AND user_id = :userId AND status = 'ACTIVE'
                LIMIT 1
                """;
        try {
            String roleStr = jdbcTemplate.queryForObject(
                    sql,
                    new MapSqlParameterSource("orgId", organizationId).addValue("userId", userId),
                    String.class
            );
            return Optional.ofNullable(roleStr).map(UserRole::valueOf);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieve all active roles assigned to a user across organizations.
     */
    public List<UserRole> findRolesByUserId(String userId) {
        String sql = """
                SELECT DISTINCT role
                FROM organization_members
                WHERE user_id = :userId AND status = 'ACTIVE'
                """;
        return jdbcTemplate.query(
                sql,
                new MapSqlParameterSource("userId", userId),
                (rs, rowNum) -> UserRole.valueOf(rs.getString("role"))
        );
    }

    /**
     * Remove or dissociate a user's role/membership from an organization.
     */
    public void removeMemberRole(String orgId, String userId) {
        String sql = """
                DELETE FROM organization_members
                WHERE organization_id = :orgId AND user_id = :userId
                """;
        jdbcTemplate.update(
                sql,
                new MapSqlParameterSource("orgId", orgId).addValue("userId", userId)
        );
    }

    /**
     * Update membership status (e.g. ACTIVE, SUSPENDED, INVITED).
     */
    public void updateMemberStatus(String orgId, String userId, String status) {
        String sql = """
                UPDATE organization_members
                SET status = :status, updated_at = :updatedAt
                WHERE organization_id = :orgId AND user_id = :userId
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("status", status)
                .addValue("orgId", orgId)
                .addValue("userId", userId)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    /**
     * Update user password hash.
     */
    public void updatePassword(String userId, String passwordHash) {
        String sql = "UPDATE users SET password_hash = :passwordHash, updated_at = :updatedAt WHERE id = :userId";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("passwordHash", passwordHash)
                .addValue("userId", userId)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    /**
     * Deactivate a user account.
     */
    public void deactivateUser(String userId) {
        String sql = "UPDATE users SET active = FALSE, updated_at = :updatedAt WHERE id = :userId";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }

    /**
     * Activate a user account.
     */
    public void activateUser(String userId) {
        String sql = "UPDATE users SET active = TRUE, updated_at = :updatedAt WHERE id = :userId";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("updatedAt", Timestamp.valueOf(LocalDateTime.now()));
        jdbcTemplate.update(sql, params);
    }
}
