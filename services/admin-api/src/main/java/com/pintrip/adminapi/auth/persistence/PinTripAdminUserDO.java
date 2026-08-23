package com.pintrip.adminapi.auth.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "pintrip_admin_user")
public class PinTripAdminUserDO {
    public static final byte STATUS_ENABLED = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(unique = true, length = 128)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 64)
    private String displayName;

    @Column(nullable = false)
    private byte status;

    @Column(name = "failed_login_count", nullable = false)
    private int failedLoginCount;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "pintrip_admin_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<PinTripAdminRoleDO> roles = new LinkedHashSet<>();

    protected PinTripAdminUserDO() {
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getDisplayName() { return displayName; }
    public int getFailedLoginCount() { return failedLoginCount; }
    public Instant getLockedUntil() { return lockedUntil; }
    public Set<PinTripAdminRoleDO> getRoles() { return Set.copyOf(roles); }

    public boolean isEnabled() { return status == STATUS_ENABLED; }

    public boolean isTemporarilyLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public void recordFailedLogin(int maxFailures, Instant lockUntil) {
        failedLoginCount++;
        if (failedLoginCount >= maxFailures) {
            lockedUntil = lockUntil;
        }
    }

    public void recordSuccessfulLogin(Instant now) {
        failedLoginCount = 0;
        lockedUntil = null;
        lastLoginAt = now;
    }
}
