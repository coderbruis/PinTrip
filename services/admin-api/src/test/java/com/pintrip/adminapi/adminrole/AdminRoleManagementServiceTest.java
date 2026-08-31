package com.pintrip.adminapi.adminrole;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pintrip.adminapi.adminrole.AdminRoleModels.AdminRoleItem;
import com.pintrip.adminapi.adminrole.AdminRoleModels.CreateAdminRoleRequest;
import com.pintrip.adminapi.adminrole.AdminRoleModels.UpdateAdminRoleRequest;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AdminRoleManagementServiceTest {
    private static final Instant NOW = Instant.parse("2026-08-30T10:00:00Z");

    @Mock
    private AdminRoleRepository repository;

    private AdminRoleManagementService service;

    @BeforeEach
    void setUp() {
        service = new AdminRoleManagementService(repository);
    }

    @Test
    void createsNormalizedRole() {
        AdminRoleItem saved = role(3L, "CONTENT_EDITOR", 0, false);
        when(repository.existsByCode("CONTENT_EDITOR")).thenReturn(false);
        when(repository.findByCode("CONTENT_EDITOR")).thenReturn(saved);

        AdminRoleItem result = service.create(new CreateAdminRoleRequest(
                " content_editor ", " 内容运营 ", 1));

        assertEquals(saved, result);
        verify(repository).create("CONTENT_EDITOR", "内容运营", (byte) 1);
    }

    @Test
    void rejectsEditingSuperAdminRole() {
        when(repository.findById(1L)).thenReturn(role(1L, "SUPER_ADMIN", 1, true));

        assertThrows(ResponseStatusException.class,
                () -> service.update(1L, new UpdateAdminRoleRequest("其他名称", 1)));

        verify(repository, never()).update(1L, "其他名称", (byte) 1);
    }

    @Test
    void rejectsDeletingAssignedRole() {
        when(repository.findById(3L)).thenReturn(role(3L, "CONTENT_EDITOR", 2, false));

        assertThrows(ResponseStatusException.class, () -> service.delete(3L));

        verify(repository, never()).delete(3L);
    }

    @Test
    void deletesUnassignedCustomRole() {
        when(repository.findById(3L)).thenReturn(role(3L, "CONTENT_EDITOR", 0, false));

        service.delete(3L);

        verify(repository).delete(3L);
    }

    private AdminRoleItem role(Long id, String code, long userCount, boolean systemRole) {
        return new AdminRoleItem(
                id, code, code, (byte) 1, userCount, 3, NOW, NOW, systemRole);
    }
}
