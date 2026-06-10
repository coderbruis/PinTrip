package com.pintrip.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plugin/xhs")
public class XhsImportController {
    @PostMapping("/importer-ready")
    public ResponseEntity<Map<String, Object>> ready(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("accepted", true, "receivedAt", Instant.now().toString()));
    }

    @PostMapping("/import-callback")
    public ResponseEntity<Map<String, Object>> importCallback(@Valid @RequestBody XhsImportCallbackRequest request) {
        return ResponseEntity.ok(Map.of(
                "accepted", true,
                "noteId", request.note() == null ? "" : request.note().noteId(),
                "receivedAt", Instant.now().toString()
        ));
    }

    public record XhsImportCallbackRequest(
            @NotBlank String source,
            String importer,
            String pageUrl,
            String capturedAt,
            ImportedNote note,
            Map<String, Object> raw
    ) {}

    public record ImportedNote(
            String noteId,
            String title,
            String desc,
            Map<String, Object> author,
            List<String> tags,
            List<String> images,
            Map<String, Object> interactInfo
    ) {}
}
