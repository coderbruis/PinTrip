package com.pintrip.adminapi.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pintrip.adminapi.auth.model.PinTripAuthenticatedAdmin;
import com.pintrip.adminapi.auth.persistence.PinTripAdminRoleDO;
import com.pintrip.adminapi.auth.persistence.PinTripAdminUserDO;
import com.pintrip.adminapi.auth.persistence.PinTripAdminUserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class AdminAuthenticationServiceTest {
    private static final Instant NOW = Instant.parse("2026-08-23T08:00:00Z");
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    private PinTripAdminUserRepository repository;
    private PasswordEncoder passwordEncoder;
    private AdminAuthenticationService service;

    @BeforeEach
    void setUp() {
        repository = mock(PinTripAdminUserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new AdminAuthenticationService();
        ReflectionTestUtils.setField(service, "repository", repository);
        ReflectionTestUtils.setField(service, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(service, "maxFailures", 5);
        ReflectionTestUtils.setField(service, "lockDuration", LOCK_DURATION);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void authenticatesEnabledUserAndReturnsDatabaseRoles() {
        PinTripAdminUserDO user = enabledUser();
        PinTripAdminRoleDO role = mock(PinTripAdminRoleDO.class);
        when(role.isEnabled()).thenReturn(true);
        when(role.getRoleCode()).thenReturn("OPERATOR");
        when(user.getRoles()).thenReturn(Set.of(role));
        when(passwordEncoder.matches("correct-password", "bcrypt-hash")).thenReturn(true);

        PinTripAuthenticatedAdmin result = service.authenticate(" operator ", "correct-password");

        assertEquals("operator", result.username());
        assertEquals(java.util.List.of("ROLE_OPERATOR"), result.roles());
        verify(user).recordSuccessfulLogin(NOW);
    }

    @Test
    void incrementsFailureCountWhenPasswordDoesNotMatch() {
        PinTripAdminUserDO user = enabledUser();
        when(passwordEncoder.matches("wrong-password", "bcrypt-hash")).thenReturn(false);

        assertThrows(BadCredentialsException.class,
                () -> service.authenticate("operator", "wrong-password"));

        verify(user).recordFailedLogin(5, NOW.plus(LOCK_DURATION));
        verify(user, never()).recordSuccessfulLogin(NOW);
    }

    @Test
    void rejectsDisabledUserBeforeCheckingPassword() {
        PinTripAdminUserDO user = mock(PinTripAdminUserDO.class);
        when(repository.findForAuthentication("operator")).thenReturn(Optional.of(user));
        when(user.isEnabled()).thenReturn(false);

        assertThrows(DisabledException.class, () -> service.authenticate("operator", "password"));

        verify(passwordEncoder, never()).matches("password", null);
    }

    @Test
    void rejectsTemporarilyLockedUserBeforeCheckingPassword() {
        PinTripAdminUserDO user = enabledUser();
        when(user.isTemporarilyLocked(NOW)).thenReturn(true);

        assertThrows(LockedException.class, () -> service.authenticate("operator", "password"));

        verify(passwordEncoder, never()).matches("password", "bcrypt-hash");
    }

    private PinTripAdminUserDO enabledUser() {
        PinTripAdminUserDO user = mock(PinTripAdminUserDO.class);
        when(repository.findForAuthentication("operator")).thenReturn(Optional.of(user));
        when(user.isEnabled()).thenReturn(true);
        when(user.isTemporarilyLocked(NOW)).thenReturn(false);
        when(user.getUsername()).thenReturn("operator");
        when(user.getEmail()).thenReturn("operator@pintrip.cn");
        when(user.getDisplayName()).thenReturn("运营管理员");
        when(user.getPasswordHash()).thenReturn("bcrypt-hash");
        return user;
    }
}
