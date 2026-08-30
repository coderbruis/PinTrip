package com.pintrip.adminapi.menu;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public final class AdminMenuModels {
    private AdminMenuModels() {
    }

    public record NavigationGroup(
            String key,
            String label,
            String hint,
            String icon,
            List<NavigationItem> items) {
    }

    public record NavigationItem(
            String key,
            String label,
            String hint,
            String icon,
            String route) {
    }

    public record MenuDefinition(
            String key,
            String parentKey,
            String label,
            String hint,
            String icon,
            String route,
            int sortOrder) {
    }

    public record RoleMenuAssignment(String roleCode, String roleName, List<String> menuKeys) {
    }

    public record MenuManagementData(
            List<MenuDefinition> menus,
            List<RoleMenuAssignment> roles) {
    }

    public record UpdateRoleMenusRequest(
            @NotEmpty List<@Pattern(regexp = "^[a-z][a-z0-9-]{1,63}$") String> menuKeys) {
    }

    public record CreateMenuRequest(
            @NotBlank @Pattern(regexp = "^[a-z][a-z0-9-]{1,63}$") String key,
            @Size(max = 64) String parentKey,
            @NotBlank @Size(max = 64) String label,
            @NotBlank @Size(max = 128) String hint,
            @NotBlank @Size(max = 32) String icon,
            @Size(max = 128) String route,
            @NotNull Integer sortOrder) {
    }

    public record UpdateMenuRequest(
            @Size(max = 64) String parentKey,
            @NotBlank @Size(max = 64) String label,
            @NotBlank @Size(max = 128) String hint,
            @NotBlank @Size(max = 32) String icon,
            @Size(max = 128) String route,
            @NotNull Integer sortOrder) {
    }
}
