package com.pintrip.adminapi.auth.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PinTripAdminLoginRequest(@NotBlank @Size(max = 64) String username,
        @NotBlank String password) {
}
