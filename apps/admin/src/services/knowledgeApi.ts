export type KnowledgeStatus = "published" | "indexing" | "failed";

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

export type ChunkPreview = {
  chunkCount: number;
  chunks: string[];
};

const apiBaseUrl = import.meta.env.VITE_ADMIN_API_URL ?? "/admin-api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers }
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { detail?: string } | undefined;
    throw new Error(body?.detail ?? `RAG 服务请求失败（${response.status}）`);
  }
  return response.json() as Promise<T>;
}

export async function listKnowledge(): Promise<KnowledgeItem[]> {
  const response = await request<{ items: KnowledgeItem[] }>("/api/admin/knowledge");
  return response.items;
}

export function importKnowledge(payload: ImportKnowledgePayload): Promise<KnowledgeItem> {
  return request<KnowledgeItem>("/api/admin/knowledge", { method: "POST", body: JSON.stringify(payload) });
}

export function previewKnowledge(payload: ImportKnowledgePayload): Promise<ChunkPreview> {
  return request<ChunkPreview>("/api/admin/knowledge/preview", { method: "POST", body: JSON.stringify(payload) });
}
