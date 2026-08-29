package com.pintrip.adminapi.knowledge;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class EmbeddingClient {
    private final String apiKey;
    private final String model;
    private final int dimensions;
    private final RestClient restClient;

    public EmbeddingClient(
            @Value("${pintrip.embedding.api-key:}") String apiKey,
            @Value("${pintrip.embedding.base-url}") String baseUrl,
            @Value("${pintrip.embedding.model}") String model,
            @Value("${pintrip.embedding.dimensions}") int dimensions) {
        this.apiKey = apiKey;
        this.model = model;
        this.dimensions = dimensions;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl.replaceAll("/$", ""))
                .build();
    }

    public List<List<Double>> embed(List<String> inputs) {
        if (apiKey.isBlank()) {
            throw new IllegalStateException(
                    "缺少 EMBEDDING_API_KEY、LLM_API_KEY 或 OPENAI_API_KEY");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("input", inputs);
        payload.put("dimensions", dimensions);

        JsonNode response = restClient.post()
                .uri("/embeddings")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(JsonNode.class);
        JsonNode data = response == null ? null : response.get("data");
        if (data == null || !data.isArray() || data.size() != inputs.size()) {
            throw new IllegalStateException("Embedding API 返回了无效的数据数量");
        }

        List<List<Double>> result = new ArrayList<>(data.size());
        for (JsonNode item : data) {
            JsonNode embedding = item.get("embedding");
            if (embedding == null || !embedding.isArray() || embedding.size() != dimensions) {
                throw new IllegalStateException("Embedding API 返回了错误的向量维度");
            }
            List<Double> vector = new ArrayList<>(embedding.size());
            embedding.forEach(value -> vector.add(value.doubleValue()));
            result.add(List.copyOf(vector));
        }
        return List.copyOf(result);
    }
}
