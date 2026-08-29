package com.pintrip.adminapi.knowledge.model;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ImportKnowledgeRequest(
        @NotBlank @Size(max = 80) String title,
        @NotBlank @Size(max = 40) String destination,
        @NotBlank @Size(min = 20, max = 20_000) String content,
        @Size(max = 20) List<@Size(max = 40) String> tags,
        @Pattern(regexp = "operator|user") String sourceType,
        @Min(200) @Max(1200) Integer chunkSize,
        @Min(0) @Max(200) Integer chunkOverlap) {

    public ImportKnowledgeRequest {
        tags = tags == null ? List.of() : List.copyOf(tags);
        sourceType = sourceType == null || sourceType.isBlank() ? "operator" : sourceType;
        chunkSize = chunkSize == null ? 500 : chunkSize;
        chunkOverlap = chunkOverlap == null ? 80 : chunkOverlap;
    }

    @AssertTrue(message = "chunkOverlap 必须小于 chunkSize")
    public boolean isOverlapValid() {
        return chunkOverlap < chunkSize;
    }
}
