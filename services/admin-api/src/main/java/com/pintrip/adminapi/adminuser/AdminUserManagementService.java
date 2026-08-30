package com.pintrip.adminapi.adminuser;

import com.pintrip.adminapi.adminuser.AdminUserModels.AdminUserItem;
import com.pintrip.adminapi.adminuser.AdminUserModels.CreateAdminUserRequest;
import com.pintrip.adminapi.adminuser.AdminUserModels.UpdateAdminUserRequest;
import com.pintrip.adminapi.auth.persistence.PinTripAdminRoleDO;
import com.pintrip.adminapi.auth.persistence.PinTripAdminRoleRepository;
import com.pintrip.adminapi.auth.persistence.PinTripAdminUserDO;
import com.pintrip.adminapi.auth.persistence.PinTripAdminUserRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserManagementService {
    private final PinTripAdminUserRepository userRepository;
    private final PinTripAdminRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock = Clock.systemUTC();

    public AdminUserManagementService(
            PinTripAdminUserRepository userRepository,
            PinTripAdminRoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminUserItem> list() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toItem).toList();
    }

    @Transactional
    public AdminUserItem create(CreateAdminUserRequest request) {
        String username = request.username().trim();
        String email = normalizeEmail(request.email());
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "账号已存在");
        }
        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "邮箱已存在");
        }
        PinTripAdminUserDO user = PinTripAdminUserDO.create(
                username,
                email,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                resolveRoles(request.roles()),
                clock.instant());
        return toItem(userRepository.save(user));
    }

    @Transactional
    public AdminUserItem update(Long id, UpdateAdminUserRequest request, String currentUsername) {
        if (request.status() != 1 && request.status() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "账号状态无效");
        }
        PinTripAdminUserDO user = find(id);
        if (user.getUsername().equalsIgnoreCase(currentUsername) && request.status() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能禁用当前登录账号");
        }
        String email = normalizeEmail(request.email());
        if (email != null && !email.equalsIgnoreCase(user.getEmail() == null ? "" : user.getEmail())
                && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "邮箱已存在");
        }
        user.updateProfile(
                email,
                request.displayName().trim(),
                request.status(),
                resolveRoles(request.roles()),
                clock.instant());
        return toItem(user);
    }

    @Transactional
    public void resetPassword(Long id, String rawPassword) {
        find(id).resetPassword(passwordEncoder.encode(rawPassword), clock.instant());
    }

    private PinTripAdminUserDO find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "账号不存在"));
    }

    private Set<PinTripAdminRoleDO> resolveRoles(List<String> requestedRoles) {
        Set<String> normalized = requestedRoles.stream()
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        List<PinTripAdminRoleDO> roles = roleRepository.findAllByRoleCodeInAndStatus(normalized, (byte) 1);
        if (roles.size() != normalized.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "包含无效或已停用的角色");
        }
        return new LinkedHashSet<>(roles);
    }

    private AdminUserItem toItem(PinTripAdminUserDO user) {
        return new AdminUserItem(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getStatus(),
                user.getRoles().stream().map(PinTripAdminRoleDO::getRoleCode).sorted().toList(),
                user.getLastLoginAt(),
                user.getCreatedAt());
    }

    private String normalizeEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
