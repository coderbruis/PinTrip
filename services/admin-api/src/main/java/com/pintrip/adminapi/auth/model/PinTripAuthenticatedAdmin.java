package com.pintrip.adminapi.auth.model;

import java.util.List;

public record PinTripAuthenticatedAdmin(String username, String email, String displayName,
        List<String> roles) {
}
