import { clearSession, getAccessToken } from "./authApi";

export type KnowledgeStatus = "published" | "indexing" | "failed" | "offline";

export type KnowledgeItem = {
  id: string;
  title: string;
  destination: string;
  source: string;
  sourceType: "operator" | "user";
  chunkCount: number;
  status: KnowledgeStatus;
  updatedAt: string;
  tags: string[];
  content: string;
  chunks: string[];
  errorMessage?: string;
};

export type ImportKnowledgePayload = {
  title: string;
  destination: string;
  content: string;
  tags?: string[];
  sourceType: "operator" | "user";
  chunkSize: number;
  chunkOverlap: number;
};

export type UpdateKnowledgePayload = Omit<ImportKnowledgePayload, "sourceType">;

export type ChunkPreview = {
  chunkCount: number;
  chunks: string[];
};

const apiBaseUrl = import.meta.env.VITE_ADMIN_API_URL ?? "/admin-api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });
  if (response.status === 401) {
    clearSession();
    window.location.reload();
    throw new Error("登录已过期，请重新登录");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { detail?: string } | undefined;
    throw new Error(body?.detail ?? `RAG 服务请求失败（${response.status}）`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listKnowledge(params: {
  page: number;
  pageSize: number;
  keyword: string;
  status: string;
  sourceType: string;
}): Promise<{ items: KnowledgeItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    keyword: params.keyword,
    status: params.status === "all" ? "" : params.status,
    sourceType: params.sourceType === "all" ? "" : params.sourceType
  });
  return request(`/api/admin/knowledge?${query}`);
}

export function importKnowledge(payload: ImportKnowledgePayload): Promise<KnowledgeItem> {
  return request<KnowledgeItem>("/api/admin/knowledge", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type BatchImportResult = {
  total: number;
  succeeded: number;
  failed: number;
  rows: { row: number; title: string; knowledgeId: string | null; error: string | null }[];
};

export function importKnowledgeFile(file: File): Promise<BatchImportResult> {
  const body = new FormData();
  body.append("file", file);
  return request("/api/admin/knowledge/batch-import", { method: "POST", body });
}

export function previewKnowledge(payload: ImportKnowledgePayload): Promise<ChunkPreview> {
  return request<ChunkPreview>("/api/admin/knowledge/preview", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateKnowledge(
  id: string,
  payload: UpdateKnowledgePayload
): Promise<KnowledgeItem> {
  return request<KnowledgeItem>(`/api/admin/knowledge/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteKnowledge(id: string): Promise<void> {
  return request<void>(`/api/admin/knowledge/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function offlineKnowledge(id: string): Promise<KnowledgeItem> {
  return request<KnowledgeItem>(`/api/admin/knowledge/${encodeURIComponent(id)}/offline`, {
    method: "POST"
  });
}

export function reindexKnowledge(id: string): Promise<KnowledgeItem> {
  return request<KnowledgeItem>(`/api/admin/knowledge/${encodeURIComponent(id)}/reindex`, {
    method: "POST"
  });
}
