package com.pintrip.adminapi.knowledge;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pintrip.adminapi.knowledge.model.KnowledgeItem;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.IntStream;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class KnowledgeRepository {
    private static final DateTimeFormatter DISPLAY_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public KnowledgeRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<KnowledgeItem> findAll() {
        return jdbcTemplate.query(
                """
                SELECT id, title, destination, source, source_type, chunk_count,
                       status, updated_at, tags, content, error_message
                FROM pintrip_knowledge_document
                ORDER BY updated_at DESC
                """,
                (rs, rowNum) -> hydrate(new DocumentRow(
                        rs.getString("id"),
                        rs.getString("title"),
                        rs.getString("destination"),
                        rs.getString("source"),
                        rs.getString("source_type"),
                        rs.getInt("chunk_count"),
                        rs.getString("status"),
                        rs.getObject("updated_at", OffsetDateTime.class),
                        readTags(rs.getString("tags")),
                        rs.getString("content"),
                        rs.getString("error_message"))));
    }

    public KnowledgeItem findById(String id) {
        return jdbcTemplate.query(
                """
                SELECT id, title, destination, source, source_type, chunk_count,
                       status, updated_at, tags, content, error_message
                FROM pintrip_knowledge_document
                WHERE id = ?
                """,
                (rs, rowNum) -> hydrate(new DocumentRow(
                        rs.getString("id"),
                        rs.getString("title"),
                        rs.getString("destination"),
                        rs.getString("source"),
                        rs.getString("source_type"),
                        rs.getInt("chunk_count"),
                        rs.getString("status"),
                        rs.getObject("updated_at", OffsetDateTime.class),
                        readTags(rs.getString("tags")),
                        rs.getString("content"),
                        rs.getString("error_message"))),
                id).stream().findFirst().orElse(null);
    }

    public void create(
            String id,
            String title,
            String destination,
            String source,
            String sourceType,
            List<String> tags,
            String content,
            List<String> chunks) {
        jdbcTemplate.update(
                """
                INSERT INTO pintrip_knowledge_document (
                    id, title, destination, source, source_type, chunk_count,
                    status, tags, content
                ) VALUES (?, ?, ?, ?, ?, ?, 'indexing', CAST(? AS jsonb), ?)
                """,
                id,
                title,
                destination,
                source,
                sourceType,
                chunks.size(),
                writeTags(tags),
                content);

        jdbcTemplate.batchUpdate(
                """
                INSERT INTO pintrip_knowledge_chunk (
                    id, knowledge_id, chunk_index, content
                ) VALUES (gen_random_uuid(), ?, ?, ?)
                """,
                IntStream.range(0, chunks.size()).boxed().toList(),
                chunks.size(),
                (statement, index) -> {
                    statement.setString(1, id);
                    statement.setInt(2, index);
                    statement.setString(3, chunks.get(index));
                });
    }

    public List<String> findChunks(String knowledgeId) {
        return jdbcTemplate.queryForList(
                """
                SELECT content
                FROM pintrip_knowledge_chunk
                WHERE knowledge_id = ?
                ORDER BY chunk_index
                """,
                String.class,
                knowledgeId);
    }

    public void saveEmbeddings(String knowledgeId, List<List<Double>> embeddings) {
        List<ChunkId> chunks = jdbcTemplate.query(
                """
                SELECT id, chunk_index
                FROM pintrip_knowledge_chunk
                WHERE knowledge_id = ?
                ORDER BY chunk_index
                """,
                (rs, rowNum) -> new ChunkId(rs.getObject("id"), rs.getInt("chunk_index")),
                knowledgeId);
        if (chunks.size() != embeddings.size()) {
            throw new IllegalStateException("Embedding 数量与知识分块数量不一致");
        }

        jdbcTemplate.batchUpdate(
                "UPDATE pintrip_knowledge_chunk SET embedding = CAST(? AS vector) WHERE id = ?",
                chunks,
                chunks.size(),
                (statement, chunk) -> {
                    statement.setString(1, toVector(embeddings.get(chunk.index())));
                    statement.setObject(2, chunk.id());
                });
    }

    public void markPublished(String id) {
        updateStatus(id, "published", null);
    }

    public void markFailed(String id, String errorMessage) {
        updateStatus(id, "failed", errorMessage);
    }

    private void updateStatus(String id, String status, String errorMessage) {
        jdbcTemplate.update(
                """
                UPDATE pintrip_knowledge_document
                SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                status,
                errorMessage,
                id);
    }

    private KnowledgeItem hydrate(DocumentRow document) {
        List<String> chunks = findChunks(document.id());
        return new KnowledgeItem(
                document.id(),
                document.title(),
                document.destination(),
                document.source(),
                document.sourceType(),
                document.chunkCount(),
                document.status(),
                DISPLAY_TIME.format(document.updatedAt()),
                document.tags(),
                document.content(),
                chunks,
                document.errorMessage());
    }

    private List<String> readTags(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("无法解析知识标签", error);
        }
    }

    private String writeTags(List<String> tags) {
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("无法序列化知识标签", error);
        }
    }

    private static String toVector(List<Double> values) {
        return values.toString();
    }

    private record DocumentRow(
            String id,
            String title,
            String destination,
            String source,
            String sourceType,
            int chunkCount,
            String status,
            OffsetDateTime updatedAt,
            List<String> tags,
            String content,
            String errorMessage) {
    }

    private record ChunkId(Object id, int index) {
    }
}
