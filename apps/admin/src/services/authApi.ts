export type AdminProfile = {
  username: string;
  email: string | null;
  displayName: string;
  roles: string[];
};

type LoginResponse = {
  accessToken: string;
  expiresAt: string;
  user: AdminProfile;
};

const apiBaseUrl = import.meta.env.VITE_ADMIN_API_URL ?? "/admin-api";
const tokenKey = "pintrip-admin-token";
const profileKey = "pintrip-admin-profile";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "账号或密码错误" : "登录服务暂时不可用");
  }
  return response.json() as Promise<LoginResponse>;
}

export function saveSession(result: LoginResponse, persistent: boolean) {
  clearSession();
  const storage = persistent ? window.localStorage : window.sessionStorage;
  storage.setItem(tokenKey, result.accessToken);
  storage.setItem(profileKey, JSON.stringify(result.user));
}

export function clearSession() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(tokenKey);
    storage.removeItem(profileKey);
  }
}

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(tokenKey) ?? window.localStorage.getItem(tokenKey);
}

export function getAdminProfile(): AdminProfile | null {
  const value = window.sessionStorage.getItem(profileKey) ?? window.localStorage.getItem(profileKey);
  if (!value) return null;
  try {
    return JSON.parse(value) as AdminProfile;
  } catch {
    clearSession();
    return null;
  }
}
