package com.pintrip.adminapi.adminrole;

import com.pintrip.adminapi.adminrole.AdminRoleModels.AdminRoleItem;
import com.pintrip.adminapi.adminrole.AdminRoleModels.CreateAdminRoleRequest;
import com.pintrip.adminapi.adminrole.AdminRoleModels.UpdateAdminRoleRequest;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminRoleManagementService {
    private final AdminRoleRepository repository;

    public AdminRoleManagementService(AdminRoleRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AdminRoleItem> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public AdminRoleItem get(Long id) {
        return find(id);
    }

    @Transactional
    public AdminRoleItem create(CreateAdminRoleRequest request) {
        String roleCode = request.roleCode().trim().toUpperCase(Locale.ROOT);
        if (repository.existsByCode(roleCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "角色编码已存在");
        }
        try {
            repository.create(roleCode, request.roleName().trim(), request.status().byteValue());
        } catch (DataIntegrityViolationException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "角色编码已存在", error);
        }
        return repository.findByCode(roleCode);
    }

    @Transactional
    public AdminRoleItem update(Long id, UpdateAdminRoleRequest request) {
        AdminRoleItem role = find(id);
        assertMutable(role);
        repository.update(id, request.roleName().trim(), request.status().byteValue());
        return find(id);
    }

    @Transactional
    public void delete(Long id) {
        AdminRoleItem role = find(id);
        assertMutable(role);
        if (role.userCount() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "该角色仍分配给 " + role.userCount() + " 个账号，请先解除账号关联");
        }
        try {
            repository.delete(id);
        } catch (DataIntegrityViolationException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "角色仍被其他数据引用，无法删除", error);
        }
    }

    private AdminRoleItem find(Long id) {
        AdminRoleItem role = repository.findById(id);
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "角色不存在");
        }
        return role;
    }

    private void assertMutable(AdminRoleItem role) {
        if (role.systemRole()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "超级管理员角色不可编辑或删除");
        }
    }
}
