package com.pintrip.adminapi.knowledge;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

class EmbeddingClientTest {

    @Test
    void generatesLocalChineseEmbeddingsWithDatabaseDimension() {
        EmbeddingClient client = new EmbeddingClient();

        List<List<Double>> embeddings = client.embed(List.of("杭州西湖一日游", "上海外滩夜景"));

        assertEquals(2, embeddings.size());
        assertEquals(EmbeddingClient.DIMENSIONS, embeddings.get(0).size());
        assertEquals(EmbeddingClient.DIMENSIONS, embeddings.get(1).size());
    }
}
