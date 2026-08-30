package com.pintrip.adminapi.controller.auth;

import com.pintrip.adminapi.adminuser.AdminUserManagementService;
import com.pintrip.adminapi.adminuser.AdminUserModels.AdminUserItem;
import com.pintrip.adminapi.adminuser.AdminUserModels.CreateAdminUserRequest;
import com.pintrip.adminapi.adminuser.AdminUserModels.ResetPasswordRequest;
import com.pintrip.adminapi.adminuser.AdminUserModels.UpdateAdminUserRequest;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("@menuPermissionService.has(authentication, 'users')")
public class AdminUserController {
    private final AdminUserManagementService service;

    public AdminUserController(AdminUserManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminUserItem> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserItem create(@Valid @RequestBody CreateAdminUserRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AdminUserItem update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdminUserRequest request,
            Principal principal) {
        return service.update(id, request, principal.getName());
    }

    @PostMapping("/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request) {
        service.resetPassword(id, request.password());
    }
}
