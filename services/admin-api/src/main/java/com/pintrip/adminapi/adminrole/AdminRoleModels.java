package com.pintrip.adminapi.adminrole;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class AdminRoleModels {
    private AdminRoleModels() {
    }

    public record AdminRoleItem(
            Long id,
            String roleCode,
            String roleName,
            byte status,
            long userCount,
            long menuCount,
            Instant createdAt,
            Instant updatedAt,
            boolean systemRole) {
    }

    public record CreateAdminRoleRequest(
            @NotBlank
            @Size(min = 2, max = 64)
            @Pattern(regexp = "^[A-Z][A-Z0-9_]+$", message = "角色编码只能包含大写字母、数字和下划线，并以字母开头")
            String roleCode,
            @NotBlank @Size(max = 64) String roleName,
            @NotNull @Min(1) @Max(2) Integer status) {
    }

    public record UpdateAdminRoleRequest(
            @NotBlank @Size(max = 64) String roleName,
            @NotNull @Min(1) @Max(2) Integer status) {
    }
}
