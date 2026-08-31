package com.pintrip.adminapi.auth.persistence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PinTripAdminUserRepository extends JpaRepository<PinTripAdminUserDO, Long> {
    @EntityGraph(attributePaths = "roles")
    List<PinTripAdminUserDO> findAllByOrderByCreatedAtDesc();

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select distinct u from PinTripAdminUserDO u left join fetch u.roles "
            + "where lower(u.username) = lower(:username)")
    Optional<PinTripAdminUserDO> findForAuthentication(@Param("username") String username);
}
