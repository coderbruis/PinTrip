package com.pintrip.adminapi.knowledge;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallzhv15q.BgeSmallZhV15QuantizedEmbeddingModel;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EmbeddingClient {
    public static final int DIMENSIONS = 512;

    private final EmbeddingModel model;

    public EmbeddingClient() {
        this.model = new BgeSmallZhV15QuantizedEmbeddingModel();
    }

    public synchronized List<List<Double>> embed(List<String> inputs) {
        if (inputs.isEmpty()) {
            return List.of();
        }

        List<TextSegment> segments = inputs.stream()
                .map(TextSegment::from)
                .toList();
        List<Embedding> embeddings = model.embedAll(segments).content();
        if (embeddings.size() != inputs.size()) {
            throw new IllegalStateException("本地 Embedding 模型返回了无效的数据数量");
        }

        List<List<Double>> result = new ArrayList<>(embeddings.size());
        for (Embedding embedding : embeddings) {
            if (embedding.dimension() != DIMENSIONS) {
                throw new IllegalStateException("本地 Embedding 模型返回了错误的向量维度");
            }
            List<Double> vector = new ArrayList<>(DIMENSIONS);
            for (float value : embedding.vector()) {
                vector.add((double) value);
            }
            result.add(List.copyOf(vector));
        }
        return List.copyOf(result);
    }
}
