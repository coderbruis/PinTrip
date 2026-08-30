import { clearSession, getAccessToken } from "./authApi";

export type AdminRoleStatus = 1 | 2;

export type AdminRoleItem = {
  id: number;
  roleCode: string;
  roleName: string;
  status: AdminRoleStatus;
  userCount: number;
  menuCount: number;
  createdAt: string;
  updatedAt: string;
  systemRole: boolean;
};

export type CreateAdminRolePayload = {
  roleCode: string;
  roleName: string;
  status: AdminRoleStatus;
};

export type UpdateAdminRolePayload = {
  roleName: string;
  status: AdminRoleStatus;
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
  if (response.status === 403) throw new Error("当前角色没有角色管理权限");
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new Error(payload?.detail ?? payload?.message ?? "角色管理操作失败");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listAdminRoles() {
  return request<AdminRoleItem[]>("/api/admin/roles");
}

export function getAdminRole(id: number) {
  return request<AdminRoleItem>(`/api/admin/roles/${id}`);
}

export function createAdminRole(payload: CreateAdminRolePayload) {
  return request<AdminRoleItem>("/api/admin/roles", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminRole(id: number, payload: UpdateAdminRolePayload) {
  return request<AdminRoleItem>(`/api/admin/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminRole(id: number) {
  return request<void>(`/api/admin/roles/${id}`, { method: "DELETE" });
}
