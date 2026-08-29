package com.pintrip.adminapi.knowledge.model;

import java.util.List;

public record KnowledgeItem(
        String id,
        String title,
        String destination,
        String source,
        String sourceType,
        int chunkCount,
        String status,
        String updatedAt,
        List<String> tags,
        String content,
        List<String> chunks,
        String errorMessage) {
}
