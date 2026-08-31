import { clearSession, getAccessToken } from "./authApi";

export type AdminUserStatus = 1 | 2;

export type AdminUserItem = {
  id: number;
  username: string;
  email: string | null;
  displayName: string;
  status: AdminUserStatus;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string | null;
};

export type CreateAdminUserPayload = {
  username: string;
  email?: string;
  displayName: string;
  password: string;
  roles: string[];
};

export type UpdateAdminUserPayload = {
  email?: string;
  displayName: string;
  status: AdminUserStatus;
  roles: string[];
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
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new Error(payload?.detail ?? payload?.message ?? "用户管理操作失败");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listAdminUsers() {
  return request<AdminUserItem[]>("/api/admin/users");
}

export function createAdminUser(payload: CreateAdminUserPayload) {
  return request<AdminUserItem>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminUser(id: number, payload: UpdateAdminUserPayload) {
  return request<AdminUserItem>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function resetAdminUserPassword(id: number, password: string) {
  return request<void>(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password })
  });
}
