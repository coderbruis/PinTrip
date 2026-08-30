package com.pintrip.adminapi.adminuser;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class AdminUserModels {
    private AdminUserModels() {
    }

    public record AdminUserItem(
            Long id,
            String username,
            String email,
            String displayName,
            byte status,
            List<String> roles,
            Instant lastLoginAt,
            Instant createdAt) {
    }

    public record CreateAdminUserRequest(
            @NotBlank
            @Size(min = 3, max = 64)
            @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "账号只能包含字母、数字、点、下划线和短横线")
            String username,
            @Email @Size(max = 128) String email,
            @NotBlank @Size(max = 64) String displayName,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotEmpty List<@Pattern(regexp = "^[A-Z][A-Z0-9_]{1,63}$") String> roles) {
    }

    public record UpdateAdminUserRequest(
            @Email @Size(max = 128) String email,
            @NotBlank @Size(max = 64) String displayName,
            byte status,
            @NotEmpty List<@Pattern(regexp = "^[A-Z][A-Z0-9_]{1,63}$") String> roles) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Size(min = 8, max = 72) String password) {
    }
}
