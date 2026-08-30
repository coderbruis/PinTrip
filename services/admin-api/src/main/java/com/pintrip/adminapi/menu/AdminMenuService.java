package com.pintrip.adminapi.menu;

import com.pintrip.adminapi.menu.AdminMenuModels.MenuDefinition;
import com.pintrip.adminapi.menu.AdminMenuModels.MenuManagementData;
import com.pintrip.adminapi.menu.AdminMenuModels.NavigationGroup;
import com.pintrip.adminapi.menu.AdminMenuModels.NavigationItem;
import com.pintrip.adminapi.menu.AdminMenuModels.RoleMenuAssignment;
import com.pintrip.adminapi.menu.AdminMenuModels.CreateMenuRequest;
import com.pintrip.adminapi.menu.AdminMenuModels.UpdateMenuRequest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;

@Service("menuPermissionService")
public class AdminMenuService {
    private final AdminMenuRepository repository;

    public AdminMenuService(AdminMenuRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NavigationGroup> navigation(Authentication authentication) {
        List<MenuDefinition> definitions = repository.findAllEnabled();
        List<String> roles = roleCodes(authentication);
        Set<String> visible = roles.contains("SUPER_ADMIN")
                ? definitions.stream().map(MenuDefinition::key).collect(Collectors.toSet())
                : new HashSet<>(repository.findMenuKeysForRoles(roles));
        return definitions.stream()
                .filter(menu -> menu.parentKey() == null && visible.contains(menu.key()))
                .map(group -> new NavigationGroup(
                        group.key(), group.label(), group.hint(), group.icon(),
                        definitions.stream()
                                .filter(item -> group.key().equals(item.parentKey()) && visible.contains(item.key()))
                                .map(item -> new NavigationItem(
                                        item.key(), item.label(), item.hint(), item.icon(), item.route()))
                                .toList()))
                .filter(group -> !group.items().isEmpty())
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuManagementData managementData() {
        List<MenuDefinition> menus = repository.findAllEnabled();
        List<String> allMenuKeys = menus.stream().map(MenuDefinition::key).toList();
        List<RoleMenuAssignment> roles = repository.findRoleAssignments().stream()
                .map(role -> "SUPER_ADMIN".equals(role.roleCode())
                        ? new RoleMenuAssignment(role.roleCode(), role.roleName(), allMenuKeys)
                        : role)
                .toList();
        return new MenuManagementData(menus, roles);
    }

    @Transactional
    public MenuManagementData updateRoleMenus(String roleCode, List<String> requestedKeys) {
        if ("SUPER_ADMIN".equalsIgnoreCase(roleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "超级管理员默认拥有全部菜单，不允许修改");
        }
        List<MenuDefinition> menus = repository.findAllEnabled();
        Map<String, MenuDefinition> byKey = menus.stream()
                .collect(Collectors.toMap(MenuDefinition::key, Function.identity()));
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String requestedKey : requestedKeys) {
            MenuDefinition menu = byKey.get(requestedKey);
            if (menu == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "包含不存在的菜单");
            normalized.add(menu.key());
            if (menu.parentKey() != null) normalized.add(menu.parentKey());
        }
        if (normalized.stream().noneMatch(key -> byKey.get(key).parentKey() != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "角色至少需要一个可访问页面");
        }
        try {
            repository.replaceRoleMenus(roleCode, new ArrayList<>(normalized));
        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, error.getMessage(), error);
        }
        return managementData();
    }

    @Transactional
    public MenuManagementData createMenu(CreateMenuRequest request) {
        String key = request.key().trim();
        if (repository.exists(key)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "菜单标识已存在");
        }
        String parentKey = normalizeParent(request.parentKey());
        validateParent(key, parentKey);
        repository.create(new MenuDefinition(
                key, parentKey, request.label().trim(), request.hint().trim(),
                request.icon().trim(), normalizeRoute(request.route(), key, parentKey), request.sortOrder()));
        return managementData();
    }

    @Transactional
    public MenuManagementData updateMenu(String key, UpdateMenuRequest request) {
        if (!repository.exists(key)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "菜单不存在");
        }
        String parentKey = normalizeParent(request.parentKey());
        validateParent(key, parentKey);
        if (repository.hasChildren(key) && parentKey != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "包含子菜单的父菜单不能移动到其他父级下");
        }
        repository.update(new MenuDefinition(
                key, parentKey, request.label().trim(), request.hint().trim(),
                request.icon().trim(), normalizeRoute(request.route(), key, parentKey), request.sortOrder()));
        return managementData();
    }

    @Transactional
    public MenuManagementData deleteMenu(String key) {
        if (!repository.exists(key)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "菜单不存在");
        }
        if (repository.hasChildren(key)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "请先删除或移动该菜单下的子菜单");
        }
        try {
            repository.delete(key);
        } catch (DataIntegrityViolationException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "菜单仍被其他数据引用，无法删除", error);
        }
        return managementData();
    }

    @Transactional(readOnly = true)
    public boolean has(Authentication authentication, String menuKey) {
        List<String> roles = roleCodes(authentication);
        return roles.contains("SUPER_ADMIN")
                || repository.findMenuKeysForRoles(roles).contains(menuKey);
    }

    private List<String> roleCodes(Authentication authentication) {
        if (authentication == null) return List.of();
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .toList();
    }

    private void validateParent(String key, String parentKey) {
        if (parentKey == null) return;
        if (key.equals(parentKey)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "菜单不能将自己设为父级");
        }
        if (!repository.isRoot(parentKey)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "父级菜单不存在或不是一级菜单");
        }
    }

    private String normalizeParent(String parentKey) {
        return parentKey == null || parentKey.isBlank() ? null : parentKey.trim();
    }

    private String normalizeRoute(String route, String key, String parentKey) {
        if (parentKey == null) return null;
        return route == null || route.isBlank() ? "#/" + key : route.trim();
    }
}
