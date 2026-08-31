package com.pintrip.adminapi.auth.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;

class SecurityConfigTest {
    private static final String SECRET = "test-jwt-secret-with-at-least-32-bytes";

    @Test
    void acceptsSignedTokenFromExpectedIssuer() {
        SecurityConfig config = new SecurityConfig();
        JwtEncoder encoder = config.jwtEncoder(SECRET);
        JwtDecoder decoder = config.jwtDecoder(SECRET);
        String token = encoder.encode(parameters("pintrip-admin-api"))
                .getTokenValue();

        assertEquals("operator", decoder.decode(token).getSubject());
    }

    @Test
    void rejectsTokenFromDifferentIssuer() {
        SecurityConfig config = new SecurityConfig();
        JwtEncoder encoder = config.jwtEncoder(SECRET);
        JwtDecoder decoder = config.jwtDecoder(SECRET);
        String token = encoder.encode(parameters("another-service"))
                .getTokenValue();

        assertThrows(JwtValidationException.class, () -> decoder.decode(token));
    }

    @Test
    void mapsJwtRolesToSpringAuthorities() {
        SecurityConfig config = new SecurityConfig();
        JwtEncoder encoder = config.jwtEncoder(SECRET);
        JwtDecoder decoder = config.jwtDecoder(SECRET);
        String token = encoder.encode(parameters("pintrip-admin-api"))
                .getTokenValue();

        var authentication = JwtRolesConverter.converter().convert(decoder.decode(token));

        assertEquals(
                List.of("ROLE_OPERATOR"),
                authentication.getAuthorities().stream().map(Object::toString).toList());
    }

    @Test
    void rejectsShortSigningSecret() {
        assertThrows(
                IllegalArgumentException.class,
                () -> new SecurityConfig().jwtDecoder("too-short"));
    }

    private JwtClaimsSet claims(String issuer) {
        Instant now = Instant.now();
        return JwtClaimsSet.builder()
                .issuer(issuer)
                .subject("operator")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(300))
                .claim("roles", List.of("ROLE_OPERATOR"))
                .build();
    }

    private JwtEncoderParameters parameters(String issuer) {
        return JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims(issuer));
    }
}
