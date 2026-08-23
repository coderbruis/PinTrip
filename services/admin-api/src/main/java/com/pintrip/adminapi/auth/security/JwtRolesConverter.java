package com.pintrip.adminapi.auth.security;

import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

final class JwtRolesConverter {
    private JwtRolesConverter() {
    }

    static Converter<Jwt, AbstractAuthenticationToken> converter() {
        return jwt -> new JwtAuthenticationToken(
                jwt,
                roles(jwt).stream().map(SimpleGrantedAuthority::new).toList(),
                jwt.getSubject());
    }

    private static List<String> roles(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles == null ? List.of() : roles;
    }
}
