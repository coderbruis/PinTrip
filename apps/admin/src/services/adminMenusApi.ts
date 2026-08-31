import type { AdminPageKey } from "../types";
import { clearSession, getAccessToken } from "./authApi";

export type AdminNavigationItem = {
  key: AdminPageKey;
  label: string;
  hint: string;
  icon: string;
  route: string;
};

export type AdminNavigationGroup = {
  key: string;
  label: string;
  hint: string;
  icon: string;
  items: AdminNavigationItem[];
};

export type MenuDefinition = {
  key: string;
  parentKey: string | null;
  label: string;
  hint: string;
  icon: string;
  route: string | null;
  sortOrder: number;
};

export type RoleMenuAssignment = {
  roleCode: string;
  roleName: string;
  menuKeys: string[];
};

export type MenuManagementData = {
  menus: MenuDefinition[];
  roles: RoleMenuAssignment[];
};

export type MenuPayload = {
  key?: string;
  parentKey?: string | null;
  label: string;
  hint: string;
  icon: string;
  route?: string | null;
  sortOrder: number;
};

const apiBaseUrl = import.meta.env.VITE_ADMIN_API_URL ?? "/admin-api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("登录已过期，请重新登录");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers
    }
  });
  if (response.status === 401) {
    clearSession();
    throw new Error("登录已过期，请重新登录");
  }
  if (response.status === 403) throw new Error("当前角色没有该菜单权限");
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new Error(payload?.detail ?? payload?.message ?? "菜单服务请求失败");
  }
  return response.json() as Promise<T>;
}

export function getAdminNavigation() {
  return request<AdminNavigationGroup[]>("/api/admin/navigation");
}

export function getMenuManagementData() {
  return request<MenuManagementData>("/api/admin/menus");
}

export function createMenu(payload: MenuPayload) {
  return request<MenuManagementData>("/api/admin/menus", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateMenu(key: string, payload: MenuPayload) {
  return request<MenuManagementData>(`/api/admin/menus/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteMenu(key: string) {
  return request<MenuManagementData>(`/api/admin/menus/${encodeURIComponent(key)}`, {
    method: "DELETE"
  });
}

export function updateRoleMenus(roleCode: string, menuKeys: string[]) {
  return request<MenuManagementData>(`/api/admin/menus/roles/${roleCode}`, {
    method: "PUT",
    body: JSON.stringify({ menuKeys })
  });
}
