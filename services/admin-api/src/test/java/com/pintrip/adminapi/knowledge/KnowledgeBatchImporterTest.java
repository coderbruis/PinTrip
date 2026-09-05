package com.pintrip.adminapi.knowledge;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pintrip.adminapi.knowledge.model.KnowledgeItem;
import jakarta.validation.Validation;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class KnowledgeBatchImporterTest {
    private final KnowledgeService service = mock(KnowledgeService.class);
    private final KnowledgeBatchImporter importer = new KnowledgeBatchImporter(
            new ObjectMapper(), Validation.buildDefaultValidatorFactory().getValidator(), service);

    private MockMultipartFile file(String name, String content) {
        return new MockMultipartFile("file", name, "application/octet-stream", content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void csvPreservesQuotedCommasNewlinesAndBom() {
        var rows = importer.parse(file("travel.csv", "\uFEFFtitle,destination,content\r\n成都,成都,\"第一天,公园\n第二天,博物馆\"\r\n"));
        assertEquals(1, rows.size());
        assertEquals("第一天,公园\n第二天,博物馆", rows.get(0).get("content"));
    }

    @Test
    void importsValidJsonEvenWhenAnotherRecordIsInvalid() {
        when(service.importKnowledge(any())).thenReturn(new KnowledgeItem("KB-1", "成都", "成都", "运营导入", "operator", 1, "indexing", "", List.of(), "", List.of(), null));
        var result = importer.importFile(file("travel.json", """
                [{"title":"成都","destination":"成都","content":"第一天游览人民公园与宽窄巷子，第二天参观博物馆，第三天体验本地美食。","tags":["美食"]},
                 {"title":"无效","destination":"成都","content":"太短"}]
                """));
        assertEquals(1, result.succeeded());
        assertEquals(1, result.failed());
        assertEquals("KB-1", result.rows().get(0).knowledgeId());
        assertTrue(result.rows().get(1).error().contains("content"));
        verify(service, times(1)).importKnowledge(any());
    }

    @Test
    void parsesExcelAndRejectsFormula() throws Exception {
        try (var book = new XSSFWorkbook(); var bytes = new ByteArrayOutputStream()) {
            var sheet = book.createSheet();
            var header = sheet.createRow(0);
            header.createCell(0).setCellValue("title");
            header.createCell(1).setCellValue("destination");
            header.createCell(2).setCellValue("content");
            var row = sheet.createRow(1);
            row.createCell(0).setCellValue("成都游");
            row.createCell(1).setCellValue("成都");
            row.createCell(2).setCellValue("攻略正文");
            book.write(bytes);
            assertEquals("成都游", importer.parse(new MockMultipartFile("file", "travel.xlsx", "application/octet-stream", bytes.toByteArray())).get(0).get("title"));
            row.getCell(2).setCellFormula("1+1");
            bytes.reset(); book.write(bytes);
            assertThrows(ResponseStatusException.class, () -> importer.parse(new MockMultipartFile("file", "travel.xlsx", "application/octet-stream", bytes.toByteArray())));
        }
    }

    @Test
    void rejectsMalformedOrOversizedBatchesBeforeAnyWrites() {
        assertThrows(ResponseStatusException.class, () -> importer.importFile(file("bad.csv", "title,content\n标题,正文")));
        assertThrows(ResponseStatusException.class, () -> importer.importFile(file("bad.json", "{}")));
        String records = String.join(",", java.util.Collections.nCopies(101, "{\"title\":\"test\"}"));
        assertThrows(ResponseStatusException.class, () -> importer.importFile(file("large.json", "[" + records + "]")));
        verifyNoInteractions(service);
    }
}
