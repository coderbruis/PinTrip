package com.pintrip.adminapi.controller.knowledge;

import com.pintrip.adminapi.knowledge.EmbeddingClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/internal/embeddings")
public class InternalEmbeddingController {
    private final EmbeddingClient embeddingClient;
    private final String internalKey;

    public InternalEmbeddingController(
            EmbeddingClient embeddingClient,
            @Value("${pintrip.embedding.internal-key}") String internalKey) {
        this.embeddingClient = embeddingClient;
        this.internalKey = internalKey;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public EmbeddingResponse embed(
            @RequestHeader("X-PinTrip-Internal-Key") String suppliedKey,
            @Valid @RequestBody EmbeddingRequest request) {
        if (!internalKey.equals(suppliedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无效的内部服务密钥");
        }
        return new EmbeddingResponse(EmbeddingClient.DIMENSIONS, embeddingClient.embed(request.inputs()));
    }

    public record EmbeddingRequest(
            @NotEmpty @Size(max = 64) List<@Size(min = 1, max = 4000) String> inputs) {
    }

    public record EmbeddingResponse(int dimensions, List<List<Double>> embeddings) {
    }
}
