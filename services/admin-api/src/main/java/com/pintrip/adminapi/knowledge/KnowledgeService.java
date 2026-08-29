package com.pintrip.adminapi.knowledge;

import com.pintrip.adminapi.knowledge.model.ChunkPreview;
import com.pintrip.adminapi.knowledge.model.ImportKnowledgeRequest;
import com.pintrip.adminapi.knowledge.model.KnowledgeItem;
import com.pintrip.adminapi.knowledge.model.KnowledgeList;
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

    public KnowledgeList list() {
        return new KnowledgeList(repository.findAll());
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

    private List<String> chunks(ImportKnowledgeRequest request) {
        return chunker.chunk(
                request.content().trim(),
                request.chunkSize(),
                request.chunkOverlap());
    }
}
