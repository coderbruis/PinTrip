export type SourcePlatform = "xiaohongshu";

export interface ImportedNote {
  note_id: string;
  title: string;
  desc: string;
  author?: {
    user_id?: string;
    nickname?: string;
    avatar?: string;
  } | null;
  tags: string[];
  images: string[];
  interact_info?: Record<string, unknown>;
}

export interface XhsImportCallback {
  source: SourcePlatform;
  importer?: string;
  page_url: string;
  captured_at: string;
  note: ImportedNote | null;
  raw?: unknown;
}
