package com.pintrip.adminapi.knowledge;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/knowledge")
public class KnowledgeAdminController {
    @Resource
    private RagClient ragClient;

    @GetMapping
    public JsonNode list() {
        return ragClient.listKnowledge();
    }

    @GetMapping("/{knowledgeId}")
    public JsonNode get(@PathVariable String knowledgeId) {
        return ragClient.getKnowledge(knowledgeId);
    }

    @PostMapping("/preview")
    public JsonNode preview(@RequestBody JsonNode request) {
        return ragClient.previewKnowledge(request);
    }

    @PostMapping
    public ResponseEntity<JsonNode> importKnowledge(@RequestBody JsonNode request) {
        return ResponseEntity.accepted().body(ragClient.importKnowledge(request));
    }
}
