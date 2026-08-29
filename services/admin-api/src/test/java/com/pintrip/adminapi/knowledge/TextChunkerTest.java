package com.pintrip.adminapi.knowledge;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

class TextChunkerTest {
    private final TextChunker chunker = new TextChunker();

    @Test
    void groupsParagraphsAndKeepsConfiguredOverlap() {
        List<String> chunks = chunker.chunk(
                "第一段内容。\n\n第二段比较长的内容。\n\n第三段内容。",
                20,
                4);

        assertEquals(2, chunks.size());
        assertEquals("第一段内容。\n\n第二段比较长的内容。", chunks.get(0));
        assertEquals("的内容。\n\n第三段内容。", chunks.get(1));
    }

    @Test
    void splitsLongParagraphUsingOverlap() {
        assertEquals(
                List.of("abcdef", "efghij", "ij"),
                chunker.chunk("abcdefghij", 6, 2));
    }
}
