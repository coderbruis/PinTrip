package com.pintrip.adminapi.knowledge;

import com.pintrip.adminapi.knowledge.model.ChunkPreview;
import com.pintrip.adminapi.knowledge.model.ImportKnowledgeRequest;
import com.pintrip.adminapi.knowledge.model.KnowledgeItem;
import com.pintrip.adminapi.knowledge.model.KnowledgeList;
import com.pintrip.adminapi.knowledge.model.UpdateKnowledgeRequest;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class KnowledgeService {
    private final TextChunker chunker;
    private final KnowledgeRepository repository;
    private final KnowledgeIndexingService indexingService;
    private final TransactionTemplate transactionTemplate;

    public KnowledgeService(
            TextChunker chunker,
            KnowledgeRepository repository,
            KnowledgeIndexingService indexingService,
            TransactionTemplate transactionTemplate) {
        this.chunker = chunker;
        this.repository = repository;
        this.indexingService = indexingService;
        this.transactionTemplate = transactionTemplate;
    }

    public KnowledgeList list(int page, int pageSize, String keyword, String status, String sourceType) {
        if (page < 1 || pageSize < 1 || pageSize > 100
                || keyword.length() > 200
                || !List.of("", "published", "indexing", "failed", "offline").contains(status)
                || !List.of("", "operator", "user").contains(sourceType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "分页或筛选参数无效");
        }
        return repository.search(page, pageSize, keyword.trim(), status, sourceType);
    }

    public KnowledgeItem get(String knowledgeId) {
        KnowledgeItem item = repository.findById(knowledgeId);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "知识条目不存在");
        }
        return item;
    }

    public ChunkPreview preview(ImportKnowledgeRequest request) {
        List<String> chunks = chunks(request);
        return new ChunkPreview(chunks.size(), chunks);
    }

    public KnowledgeItem importKnowledge(ImportKnowledgeRequest request) {
        List<String> chunks = chunks(request);
        if (chunks.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "攻略正文未生成有效知识分块");
        }
        String knowledgeId = "KB-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase(Locale.ROOT);
        List<String> tags = request.tags().stream()
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .toList();

        transactionTemplate.executeWithoutResult(status -> repository.create(
                knowledgeId,
                request.title().trim(),
                request.destination().trim(),
                "operator".equals(request.sourceType()) ? "运营导入" : "用户沉淀",
                request.sourceType(),
                tags,
                request.content().trim(),
                chunks));
        indexingService.indexAsync(knowledgeId);
        return get(knowledgeId);
    }

    public KnowledgeItem update(String knowledgeId, UpdateKnowledgeRequest request) {
        get(knowledgeId);
        List<String> chunks = chunker.chunk(
                request.content().trim(), request.chunkSize(), request.chunkOverlap());
        if (chunks.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "攻略正文未生成有效知识分块");
        }
        List<String> tags = normalizeTags(request.tags());
        transactionTemplate.executeWithoutResult(status -> repository.update(
                knowledgeId,
                request.title().trim(),
                request.destination().trim(),
                tags,
                request.content().trim(),
                chunks));
        indexingService.indexAsync(knowledgeId);
        return get(knowledgeId);
    }

    public void delete(String knowledgeId) {
        if (repository.delete(knowledgeId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "知识条目不存在");
        }
    }

    public KnowledgeItem offline(String knowledgeId) {
        if (repository.markOffline(knowledgeId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "知识条目不存在");
        }
        return get(knowledgeId);
    }

    public KnowledgeItem reindex(String knowledgeId) {
        get(knowledgeId);
        repository.markIndexing(knowledgeId);
        indexingService.indexAsync(knowledgeId);
        return get(knowledgeId);
    }

    private List<String> chunks(ImportKnowledgeRequest request) {
        return chunker.chunk(
                request.content().trim(),
                request.chunkSize(),
                request.chunkOverlap());
    }

    private static List<String> normalizeTags(List<String> tags) {
        return tags.stream()
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .toList();
    }
}
