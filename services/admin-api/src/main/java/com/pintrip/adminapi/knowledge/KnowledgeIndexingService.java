package com.pintrip.adminapi.knowledge;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeIndexingService {
    private static final Logger LOGGER = LoggerFactory.getLogger(KnowledgeIndexingService.class);

    private final KnowledgeRepository repository;
    private final EmbeddingClient embeddingClient;

    public KnowledgeIndexingService(
            KnowledgeRepository repository,
            EmbeddingClient embeddingClient) {
        this.repository = repository;
        this.embeddingClient = embeddingClient;
    }

    @Async
    public void indexAsync(String knowledgeId) {
        try {
            List<String> chunks = repository.findChunks(knowledgeId);
            if (chunks.isEmpty()) {
                throw new IllegalStateException("攻略正文未生成有效知识分块");
            }
            repository.saveEmbeddings(knowledgeId, embeddingClient.embed(chunks));
            repository.markPublished(knowledgeId);
            LOGGER.info("knowledge.indexed knowledge_id={} chunks={}", knowledgeId, chunks.size());
        } catch (Exception error) {
            String message = error.getMessage() == null
                    ? error.getClass().getSimpleName()
                    : error.getMessage();
            repository.markFailed(knowledgeId, message.substring(0, Math.min(1000, message.length())));
            LOGGER.error(
                    "knowledge.index_failed knowledge_id={} error_type={}",
                    knowledgeId,
                    error.getClass().getSimpleName());
        }
    }
}
