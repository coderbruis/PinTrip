package com.pintrip.adminapi.knowledge.model;

import java.util.List;

public record KnowledgeList(List<KnowledgeItem> items, long total, int page, int pageSize) {
}
