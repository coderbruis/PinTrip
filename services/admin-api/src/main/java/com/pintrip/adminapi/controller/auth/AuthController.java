package com.pintrip.adminapi.controller.auth;

import com.pintrip.adminapi.auth.model.PinTripAdminLoginRequest;
import com.pintrip.adminapi.auth.model.PinTripAdminLoginResponse;
import com.pintrip.adminapi.auth.model.PinTripAdminProfile;
import com.pintrip.adminapi.auth.model.PinTripAuthenticatedAdmin;
import com.pintrip.adminapi.auth.service.AdminAuthenticationService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AuthController {
    @Resource
    private AdminAuthenticationService authenticationService;

    @Resource
    private JwtEncoder jwtEncoder;

    @Value("${pintrip.security.token-ttl}")
    private Duration tokenTtl;

    @PostMapping("/login")
    public PinTripAdminLoginResponse login(@Valid @RequestBody PinTripAdminLoginRequest request) {
        PinTripAuthenticatedAdmin admin = authenticationService.authenticate(request.username(), request.password());
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(tokenTtl);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("pintrip-admin-api")
                .subject(admin.username())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("roles", admin.roles())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new PinTripAdminLoginResponse(token, expiresAt,
                new PinTripAdminProfile(admin.username(), admin.email(), admin.displayName(), admin.roles()));
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ProblemDetail authenticationFailed() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }
}
