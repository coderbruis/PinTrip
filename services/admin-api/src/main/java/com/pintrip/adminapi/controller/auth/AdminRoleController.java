package com.pintrip.adminapi.controller.auth;

import com.pintrip.adminapi.adminrole.AdminRoleManagementService;
import com.pintrip.adminapi.adminrole.AdminRoleModels.AdminRoleItem;
import com.pintrip.adminapi.adminrole.AdminRoleModels.CreateAdminRoleRequest;
import com.pintrip.adminapi.adminrole.AdminRoleModels.UpdateAdminRoleRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/roles")
public class AdminRoleController {
    private final AdminRoleManagementService service;

    public AdminRoleController(AdminRoleManagementService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@menuPermissionService.has(authentication, 'roles') or @menuPermissionService.has(authentication, 'users')")
    public List<AdminRoleItem> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@menuPermissionService.has(authentication, 'roles')")
    public AdminRoleItem get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @PreAuthorize("@menuPermissionService.has(authentication, 'roles')")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminRoleItem create(@Valid @RequestBody CreateAdminRoleRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@menuPermissionService.has(authentication, 'roles')")
    public AdminRoleItem update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdminRoleRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@menuPermissionService.has(authentication, 'roles')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
