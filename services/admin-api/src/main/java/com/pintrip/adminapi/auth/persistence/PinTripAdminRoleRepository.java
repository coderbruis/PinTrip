package com.pintrip.adminapi.auth.persistence;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PinTripAdminRoleRepository extends JpaRepository<PinTripAdminRoleDO, Long> {
    List<PinTripAdminRoleDO> findAllByRoleCodeInAndStatus(Collection<String> roleCodes, byte status);
}
