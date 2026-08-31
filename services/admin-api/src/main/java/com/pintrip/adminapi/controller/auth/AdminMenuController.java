package com.pintrip.adminapi.controller.auth;

import com.pintrip.adminapi.menu.AdminMenuModels.MenuManagementData;
import com.pintrip.adminapi.menu.AdminMenuModels.NavigationGroup;
import com.pintrip.adminapi.menu.AdminMenuModels.UpdateRoleMenusRequest;
import com.pintrip.adminapi.menu.AdminMenuModels.CreateMenuRequest;
import com.pintrip.adminapi.menu.AdminMenuModels.UpdateMenuRequest;
import com.pintrip.adminapi.menu.AdminMenuService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminMenuController {
    private final AdminMenuService service;

    public AdminMenuController(AdminMenuService service) {
        this.service = service;
    }

    @GetMapping("/navigation")
    public List<NavigationGroup> navigation(Authentication authentication) {
        return service.navigation(authentication);
    }

    @GetMapping("/menus")
    @PreAuthorize("@menuPermissionService.has(authentication, 'menus') or @menuPermissionService.has(authentication, 'roles')")
    public MenuManagementData managementData() {
        return service.managementData();
    }

    @PutMapping("/menus/roles/{roleCode}")
    @PreAuthorize("@menuPermissionService.has(authentication, 'roles')")
    public MenuManagementData updateRoleMenus(
            @PathVariable String roleCode,
            @Valid @RequestBody UpdateRoleMenusRequest request) {
        return service.updateRoleMenus(roleCode, request.menuKeys());
    }

    @PostMapping("/menus")
    @PreAuthorize("@menuPermissionService.has(authentication, 'menus')")
    public MenuManagementData createMenu(@Valid @RequestBody CreateMenuRequest request) {
        return service.createMenu(request);
    }

    @PutMapping("/menus/{key}")
    @PreAuthorize("@menuPermissionService.has(authentication, 'menus')")
    public MenuManagementData updateMenu(
            @PathVariable String key,
            @Valid @RequestBody UpdateMenuRequest request) {
        return service.updateMenu(key, request);
    }

    @DeleteMapping("/menus/{key}")
    @PreAuthorize("@menuPermissionService.has(authentication, 'menus')")
    public MenuManagementData deleteMenu(@PathVariable String key) {
        return service.deleteMenu(key);
    }
}
