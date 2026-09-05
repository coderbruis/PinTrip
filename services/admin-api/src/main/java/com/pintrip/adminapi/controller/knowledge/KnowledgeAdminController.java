package com.pintrip.adminapi.controller.knowledge;

import com.pintrip.adminapi.knowledge.KnowledgeService;
import com.pintrip.adminapi.knowledge.model.ChunkPreview;
import com.pintrip.adminapi.knowledge.model.ImportKnowledgeRequest;
import com.pintrip.adminapi.knowledge.model.KnowledgeItem;
import com.pintrip.adminapi.knowledge.model.KnowledgeList;
import com.pintrip.adminapi.knowledge.model.UpdateKnowledgeRequest;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/knowledge")
@PreAuthorize("@menuPermissionService.has(authentication, 'knowledge')")
public class KnowledgeAdminController {
    @Resource
    private KnowledgeService knowledgeService;
    @Resource
    private com.pintrip.adminapi.knowledge.KnowledgeBatchImporter batchImporter;

    @PostMapping(value = "/batch-import", consumes = "multipart/form-data")
    public com.pintrip.adminapi.knowledge.KnowledgeBatchImporter.BatchResult batchImport(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return batchImporter.importFile(file);
    }

    @GetMapping
    public KnowledgeList list(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "1") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "8") int pageSize,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "") String keyword,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "") String status,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "") String sourceType) {
        return knowledgeService.list(page, pageSize, keyword, status, sourceType);
    }

    @GetMapping("/{knowledgeId}")
    public KnowledgeItem get(@PathVariable String knowledgeId) {
        return knowledgeService.get(knowledgeId);
    }

    @PostMapping("/preview")
    public ChunkPreview preview(@Valid @RequestBody ImportKnowledgeRequest request) {
        return knowledgeService.preview(request);
    }

    @PostMapping
    public ResponseEntity<KnowledgeItem> importKnowledge(
            @Valid @RequestBody ImportKnowledgeRequest request) {
        return ResponseEntity.accepted().body(knowledgeService.importKnowledge(request));
    }

    @PutMapping("/{knowledgeId}")
    public ResponseEntity<KnowledgeItem> update(
            @PathVariable String knowledgeId,
            @Valid @RequestBody UpdateKnowledgeRequest request) {
        return ResponseEntity.accepted().body(knowledgeService.update(knowledgeId, request));
    }

    @DeleteMapping("/{knowledgeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String knowledgeId) {
        knowledgeService.delete(knowledgeId);
    }

    @PostMapping("/{knowledgeId}/offline")
    public KnowledgeItem offline(@PathVariable String knowledgeId) {
        return knowledgeService.offline(knowledgeId);
    }

    @PostMapping("/{knowledgeId}/reindex")
    public ResponseEntity<KnowledgeItem> reindex(@PathVariable String knowledgeId) {
        return ResponseEntity.accepted().body(knowledgeService.reindex(knowledgeId));
    }
}
