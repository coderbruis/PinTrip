package com.pintrip.adminapi.knowledge;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class TextChunker {
    public List<String> chunk(String content, int chunkSize, int overlap) {
        String[] rawParagraphs = content.trim().split("\\R\\s*\\R");
        List<String> chunks = new ArrayList<>();
        String current = "";

        for (String raw : rawParagraphs) {
            String paragraph = raw.trim();
            if (paragraph.isEmpty()) {
                continue;
            }
            if (paragraph.length() > chunkSize) {
                if (!current.isEmpty()) {
                    chunks.add(current);
                    current = "";
                }
                splitLongText(paragraph, chunkSize, overlap, chunks);
                continue;
            }

            String candidate = current.isEmpty() ? paragraph : current + "\n\n" + paragraph;
            if (candidate.length() <= chunkSize) {
                current = candidate;
                continue;
            }

            chunks.add(current);
            String prefix = overlap == 0
                    ? ""
                    : current.substring(Math.max(0, current.length() - overlap));
            current = prefix.isEmpty() ? paragraph : prefix + "\n\n" + paragraph;
        }

        if (!current.isEmpty()) {
            chunks.add(current);
        }
        return List.copyOf(chunks);
    }

    private void splitLongText(
            String content,
            int chunkSize,
            int overlap,
            List<String> chunks) {
        int step = chunkSize - overlap;
        for (int start = 0; start < content.length(); start += step) {
            chunks.add(content.substring(start, Math.min(start + chunkSize, content.length())));
        }
    }
}
