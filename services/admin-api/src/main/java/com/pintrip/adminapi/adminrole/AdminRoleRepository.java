package com.pintrip.adminapi.adminrole;

import com.pintrip.adminapi.adminrole.AdminRoleModels.AdminRoleItem;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminRoleRepository {
    private static final String SELECT_ROLE = """
            SELECT role.id, role.role_code, role.role_name, role.status,
                   role.created_at, role.updated_at,
                   COUNT(DISTINCT user_role.user_id) AS user_count,
                   COUNT(DISTINCT role_menu.menu_id) AS menu_count
            FROM pintrip_admin_role role
            LEFT JOIN pintrip_admin_user_role user_role ON user_role.role_id = role.id
            LEFT JOIN pintrip_admin_role_menu role_menu ON role_menu.role_id = role.id
            """;

    private final JdbcTemplate jdbcTemplate;

    public AdminRoleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AdminRoleItem> findAll() {
        return jdbcTemplate.query(SELECT_ROLE + """
                GROUP BY role.id
                ORDER BY role.created_at, role.id
                """, this::mapRole);
    }

    public AdminRoleItem findById(Long id) {
        return jdbcTemplate.query(SELECT_ROLE + """
                WHERE role.id = ?
                GROUP BY role.id
                """, rs -> rs.next() ? mapRole(rs, 0) : null, id);
    }

    public AdminRoleItem findByCode(String roleCode) {
        return jdbcTemplate.query(SELECT_ROLE + """
                WHERE role.role_code = ?
                GROUP BY role.id
                """, rs -> rs.next() ? mapRole(rs, 0) : null, roleCode);
    }

    public boolean existsByCode(String roleCode) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pintrip_admin_role WHERE role_code = ?",
                Integer.class,
                roleCode);
        return count != null && count > 0;
    }

    public void create(String roleCode, String roleName, byte status) {
        jdbcTemplate.update("""
                INSERT INTO pintrip_admin_role (role_code, role_name, status)
                VALUES (?, ?, ?)
                """, roleCode, roleName, status);
    }

    public int update(Long id, String roleName, byte status) {
        return jdbcTemplate.update("""
                UPDATE pintrip_admin_role
                SET role_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, roleName, status, id);
    }

    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM pintrip_admin_role WHERE id = ?", id);
    }

    private AdminRoleItem mapRole(ResultSet rs, int rowNumber) throws SQLException {
        String roleCode = rs.getString("role_code");
        return new AdminRoleItem(
                rs.getLong("id"),
                roleCode,
                rs.getString("role_name"),
                rs.getByte("status"),
                rs.getLong("user_count"),
                rs.getLong("menu_count"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant(),
                "SUPER_ADMIN".equals(roleCode));
    }
}
