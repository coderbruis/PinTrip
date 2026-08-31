package com.pintrip.adminapi.menu;

import com.pintrip.adminapi.menu.AdminMenuModels.MenuDefinition;
import com.pintrip.adminapi.menu.AdminMenuModels.RoleMenuAssignment;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class AdminMenuRepository {
    private final JdbcTemplate jdbcTemplate;

    public AdminMenuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MenuDefinition> findAllEnabled() {
        return jdbcTemplate.query("""
                SELECT menu_key, parent_key, menu_name, menu_hint, icon, route, sort_order
                FROM pintrip_admin_menu
                WHERE status = 1
                ORDER BY sort_order, id
                """, (rs, rowNum) -> new MenuDefinition(
                rs.getString("menu_key"), rs.getString("parent_key"),
                rs.getString("menu_name"), rs.getString("menu_hint"),
                rs.getString("icon"), rs.getString("route"), rs.getInt("sort_order")));
    }

    public List<String> findMenuKeysForRoles(List<String> roleCodes) {
        if (roleCodes.isEmpty()) return List.of();
        String placeholders = String.join(",", java.util.Collections.nCopies(roleCodes.size(), "?"));
        return jdbcTemplate.queryForList("""
                SELECT DISTINCT menu.menu_key
                FROM pintrip_admin_menu menu
                JOIN pintrip_admin_role_menu role_menu ON role_menu.menu_id = menu.id
                JOIN pintrip_admin_role role ON role.id = role_menu.role_id
                WHERE menu.status = 1 AND role.status = 1
                  AND role.role_code IN (%s)
                """.formatted(placeholders), String.class, roleCodes.toArray());
    }

    public List<RoleMenuAssignment> findRoleAssignments() {
        Map<String, RoleAccumulator> roles = new LinkedHashMap<>();
        jdbcTemplate.query("""
                SELECT role.role_code, role.role_name, menu.menu_key
                FROM pintrip_admin_role role
                LEFT JOIN pintrip_admin_role_menu role_menu ON role_menu.role_id = role.id
                LEFT JOIN pintrip_admin_menu menu ON menu.id = role_menu.menu_id AND menu.status = 1
                ORDER BY role.id, menu.sort_order
                """, rs -> {
            String roleName = rs.getString("role_name");
            RoleAccumulator role = roles.computeIfAbsent(
                    rs.getString("role_code"),
                    ignored -> new RoleAccumulator(roleName, new ArrayList<>()));
            String menuKey = rs.getString("menu_key");
            if (menuKey != null) role.menuKeys().add(menuKey);
        });
        return roles.entrySet().stream()
                .map(entry -> new RoleMenuAssignment(
                        entry.getKey(), entry.getValue().roleName(), List.copyOf(entry.getValue().menuKeys())))
                .toList();
    }

    public boolean exists(String menuKey) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pintrip_admin_menu WHERE menu_key = ?",
                Integer.class,
                menuKey);
        return count != null && count > 0;
    }

    public boolean hasChildren(String menuKey) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pintrip_admin_menu WHERE parent_key = ?",
                Integer.class,
                menuKey);
        return count != null && count > 0;
    }

    public boolean isRoot(String menuKey) {
        Boolean root = jdbcTemplate.query(
                "SELECT parent_key IS NULL FROM pintrip_admin_menu WHERE menu_key = ? AND status = 1",
                rs -> rs.next() ? rs.getBoolean(1) : null,
                menuKey);
        return Boolean.TRUE.equals(root);
    }

    public void create(MenuDefinition menu) {
        jdbcTemplate.update("""
                INSERT INTO pintrip_admin_menu (
                    menu_key, parent_key, menu_name, menu_hint, icon, route, sort_order, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                """, menu.key(), menu.parentKey(), menu.label(), menu.hint(),
                menu.icon(), menu.route(), menu.sortOrder());
    }

    public int update(MenuDefinition menu) {
        return jdbcTemplate.update("""
                UPDATE pintrip_admin_menu
                SET parent_key = ?, menu_name = ?, menu_hint = ?, icon = ?, route = ?,
                    sort_order = ?, updated_at = CURRENT_TIMESTAMP
                WHERE menu_key = ? AND status = 1
                """, menu.parentKey(), menu.label(), menu.hint(), menu.icon(), menu.route(),
                menu.sortOrder(), menu.key());
    }

    public int delete(String menuKey) {
        return jdbcTemplate.update("DELETE FROM pintrip_admin_menu WHERE menu_key = ?", menuKey);
    }

    @Transactional
    public void replaceRoleMenus(String roleCode, List<String> menuKeys) {
        Long roleId = jdbcTemplate.query("SELECT id FROM pintrip_admin_role WHERE role_code = ?",
                rs -> rs.next() ? rs.getLong(1) : null, roleCode);
        if (roleId == null) throw new IllegalArgumentException("角色不存在");
        jdbcTemplate.update("DELETE FROM pintrip_admin_role_menu WHERE role_id = ?", roleId);
        jdbcTemplate.batchUpdate("""
                INSERT INTO pintrip_admin_role_menu (role_id, menu_id)
                SELECT ?, id FROM pintrip_admin_menu WHERE status = 1 AND menu_key = ?
                """, menuKeys, menuKeys.size(), (statement, menuKey) -> {
            statement.setLong(1, roleId);
            statement.setString(2, menuKey);
        });
    }

    private record RoleAccumulator(String roleName, List<String> menuKeys) {
    }
}
