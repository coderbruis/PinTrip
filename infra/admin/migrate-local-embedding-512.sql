-- 从 1536 维云端 Embedding 迁移到 512 维本地 bge-small-zh-v1.5。
-- 维度不同，旧向量无法复用；保留知识正文并清空旧向量，之后重新导入或重建索引。
DROP INDEX IF EXISTS idx_knowledge_chunk_embedding;

ALTER TABLE pintrip_knowledge_chunk
    ALTER COLUMN embedding TYPE vector(512)
    USING NULL::vector(512);

UPDATE pintrip_knowledge_document
SET status = 'failed',
    error_message = '已切换本地 Embedding 模型，请重新导入或重建向量索引',
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM pintrip_knowledge_chunk chunk
    WHERE chunk.knowledge_id = pintrip_knowledge_document.id
);

CREATE INDEX idx_knowledge_chunk_embedding
    ON pintrip_knowledge_chunk
    USING hnsw (embedding vector_cosine_ops);

-- Guide Agent 旧版创建的用户攻略向量表也需要统一维度。
-- 用户攻略原始 JSON 仍保留在 pintrip_user_guides，重新索引即可恢复 chunks。
DROP INDEX IF EXISTS pintrip_guide_chunks_embedding_idx;
DO $$
BEGIN
    IF to_regclass('public.pintrip_guide_chunks') IS NOT NULL THEN
        DELETE FROM pintrip_guide_chunks;
        ALTER TABLE pintrip_guide_chunks
            ALTER COLUMN embedding TYPE vector(512)
            USING NULL::vector(512);
        CREATE INDEX pintrip_guide_chunks_embedding_idx
            ON pintrip_guide_chunks
            USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;
