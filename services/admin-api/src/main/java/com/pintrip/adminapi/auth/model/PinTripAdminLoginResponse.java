package com.pintrip.adminapi.auth.model;

import java.time.Instant;

public record PinTripAdminLoginResponse(String accessToken, Instant expiresAt, PinTripAdminProfile user) {
}
