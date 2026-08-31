package com.pintrip.adminapi.controller.knowledge;

import com.pintrip.adminapi.knowledge.KnowledgeService;
import com.pintrip.adminapi.knowledge.model.ChunkPreview;
import com.pintrip.adminapi.knowledge.model.ImportKnowledgeRequest;
import com.pintrip.adminapi.knowledge.model.KnowledgeItem;
import com.pintrip.adminapi.knowledge.model.KnowledgeList;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/knowledge")
@PreAuthorize("@menuPermissionService.has(authentication, 'knowledge')")
public class KnowledgeAdminController {
    @Resource
    private KnowledgeService knowledgeService;

    @GetMapping
    public KnowledgeList list() {
        return knowledgeService.list();
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
}
