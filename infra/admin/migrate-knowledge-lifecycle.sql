ALTER TABLE pintrip_knowledge_document
    DROP CONSTRAINT IF EXISTS ck_knowledge_status;

ALTER TABLE pintrip_knowledge_document
    ADD CONSTRAINT ck_knowledge_status
    CHECK (status IN ('indexing', 'published', 'failed', 'offline'));
