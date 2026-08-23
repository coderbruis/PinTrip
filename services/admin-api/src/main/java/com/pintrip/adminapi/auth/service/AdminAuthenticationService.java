package com.pintrip.adminapi.auth.service;

import com.pintrip.adminapi.auth.model.PinTripAuthenticatedAdmin;
import com.pintrip.adminapi.auth.persistence.PinTripAdminRoleDO;
import com.pintrip.adminapi.auth.persistence.PinTripAdminUserDO;
import com.pintrip.adminapi.auth.persistence.PinTripAdminUserRepository;
import jakarta.annotation.Resource;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthenticationService {
    private static final Logger log = LoggerFactory.getLogger(AdminAuthenticationService.class);

    @Resource
    private PinTripAdminUserRepository repository;

    @Resource
    private PasswordEncoder passwordEncoder;

    @Value("${pintrip.security.login.max-failures}")
    private int maxFailures;

    @Value("${pintrip.security.login.lock-duration}")
    private Duration lockDuration;

    private Clock clock = Clock.systemUTC();

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public PinTripAuthenticatedAdmin authenticate(String username, String rawPassword) {
        String normalizedUsername = username.trim();
        PinTripAdminUserDO user = repository.findForAuthentication(normalizedUsername).orElseThrow(() -> {
            log.warn("Admin login failed: account not found, username={}", safeUsername(normalizedUsername));
            return new BadCredentialsException("账号或密码错误");
        });
        Instant now = clock.instant();
        assertLoginAllowed(user, now);
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            user.recordFailedLogin(maxFailures, now.plus(lockDuration));
            log.warn("Admin login failed: bad credentials, username={}, failedAttempts={}",
                    safeUsername(user.getUsername()), user.getFailedLoginCount());
            throw new BadCredentialsException("账号或密码错误");
        }
        List<String> roles = enabledRoles(user);
        if (roles.isEmpty()) {
            log.warn("Admin login rejected: no enabled roles, username={}", safeUsername(user.getUsername()));
            throw new DisabledException("账号没有可用角色");
        }
        user.recordSuccessfulLogin(now);
        log.info("Admin login succeeded, username={}, roles={}", safeUsername(user.getUsername()), roles);
        return new PinTripAuthenticatedAdmin(user.getUsername(), user.getEmail(), user.getDisplayName(), roles);
    }

    private void assertLoginAllowed(PinTripAdminUserDO user, Instant now) {
        if (!user.isEnabled()) {
            log.warn("Admin login rejected: account disabled, username={}", safeUsername(user.getUsername()));
            throw new DisabledException("账号已禁用");
        }
        if (user.isTemporarilyLocked(now)) {
            log.warn("Admin login rejected: account locked, username={}, lockedUntil={}",
                    safeUsername(user.getUsername()), user.getLockedUntil());
            throw new LockedException("登录失败次数过多，请稍后再试");
        }
    }

    private List<String> enabledRoles(PinTripAdminUserDO user) {
        return user.getRoles().stream()
                .filter(PinTripAdminRoleDO::isEnabled)
                .map(role -> "ROLE_" + role.getRoleCode())
                .sorted()
                .toList();
    }

    private String safeUsername(String username) {
        if (username == null) {
            return "unknown";
        }
        return username.replace('\n', '_').replace('\r', '_');
    }
}
