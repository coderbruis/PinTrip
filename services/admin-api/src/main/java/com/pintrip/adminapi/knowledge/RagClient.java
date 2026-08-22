package com.pintrip.adminapi.knowledge;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class RagClient {
    @Value("${pintrip.rag.base-url}")
    private String baseUrl;

    private RestClient restClient;

    @PostConstruct
    public void init() {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public JsonNode listKnowledge() {
        return restClient.get().uri("/rag/knowledge").retrieve().body(JsonNode.class);
    }

    public JsonNode getKnowledge(String knowledgeId) {
        return restClient.get().uri("/rag/knowledge/{knowledgeId}", knowledgeId).retrieve().body(JsonNode.class);
    }

    public JsonNode previewKnowledge(JsonNode request) {
        return post("/rag/knowledge/preview", request);
    }

    public JsonNode importKnowledge(JsonNode request) {
        return post("/rag/knowledge/import", request);
    }

    private JsonNode post(String path, JsonNode request) {
        return restClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(JsonNode.class);
    }
}
