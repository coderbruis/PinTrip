package com.pintrip.adminapi.knowledge;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pintrip.adminapi.knowledge.model.ImportKnowledgeRequest;
import jakarta.validation.Validator;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.poi.ss.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class KnowledgeBatchImporter {
    private final ObjectMapper mapper;
    private final Validator validator;
    private final KnowledgeService service;

    public KnowledgeBatchImporter(ObjectMapper mapper, Validator validator, KnowledgeService service) {
        this.mapper = mapper;
        this.validator = validator;
        this.service = service;
    }

    public record RowResult(int row, String title, String knowledgeId, String error) {}
    public record BatchResult(int total, long succeeded, long failed, List<RowResult> rows) {}

    public BatchResult importFile(MultipartFile file) {
        List<Map<String, Object>> records = parse(file);
        List<RowResult> results = new ArrayList<>();
        for (int i = 0; i < records.size(); i++) {
            Map<String, Object> row = records.get(i);
            String title = Objects.toString(row.get("title"), "");
            try {
                Object tags = row.get("tags");
                if (tags instanceof String text) {
                    row.put("tags", Arrays.stream(text.split("[,，;；|]")).map(String::trim)
                            .filter(s -> !s.isEmpty()).toList());
                }
                row.put("sourceType", "operator");
                ImportKnowledgeRequest request = mapper.convertValue(row, ImportKnowledgeRequest.class);
                String errors = validator.validate(request).stream()
                        .map(v -> v.getPropertyPath() + ": " + v.getMessage()).sorted()
                        .collect(java.util.stream.Collectors.joining("；"));
                if (!errors.isEmpty()) throw new IllegalArgumentException(errors);
                String id = service.importKnowledge(request).id();
                results.add(new RowResult(i + 1, title, id, null));
            } catch (IllegalArgumentException error) {
                results.add(new RowResult(i + 1, title, null, "字段校验失败：" + error.getMessage()));
            } catch (Exception error) {
                results.add(new RowResult(i + 1, title, null, "入库失败，请检查服务日志后重试该条目"));
            }
        }
        long succeeded = results.stream().filter(r -> r.error() == null).count();
        return new BatchResult(results.size(), succeeded, results.size() - succeeded, results);
    }

    List<Map<String, Object>> parse(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            throw bad("请选择非空文件，大小不得超过 5 MB");
        }
        String name = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        List<Map<String, Object>> rows = new ArrayList<>();
        try {
            if (name.endsWith(".json")) {
                JsonNode root = mapper.readTree(file.getInputStream());
                if (root == null || !root.isArray()) throw bad("JSON 顶层必须是知识条目数组");
                for (JsonNode node : root) {
                    if (!node.isObject()) throw bad("JSON 数组中的条目必须是对象");
                    Map<String, Object> row = mapper.convertValue(node, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    add(rows, row);
                }
            } else if (name.endsWith(".csv")) {
                String text = new String(file.getBytes(), StandardCharsets.UTF_8).replaceFirst("^\uFEFF", "");
                try (var parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build()
                        .parse(new StringReader(text))) {
                    checkHeaders(parser.getHeaderNames());
                    for (var record : parser) {
                        if (!record.isConsistent()) throw bad("CSV 列数与表头不一致，记录 " + record.getRecordNumber());
                        add(rows, new LinkedHashMap<>(record.toMap()));
                    }
                }
            } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
                try (var workbook = WorkbookFactory.create(file.getInputStream())) {
                    if (workbook.getNumberOfSheets() == 0) throw bad("Excel 缺少工作表");
                    Sheet sheet = workbook.getSheetAt(0);
                    Row header = sheet.getRow(0);
                    if (header == null || header.getLastCellNum() > 20) throw bad("Excel 第一行必须是表头，最多 20 列");
                    DataFormatter formatter = new DataFormatter(Locale.ROOT);
                    List<String> names = new ArrayList<>();
                    for (int col = 0; col < header.getLastCellNum(); col++) {
                        names.add(formatter.formatCellValue(header.getCell(col)).trim());
                    }
                    checkHeaders(names);
                    for (Row record : sheet) {
                        if (record.getRowNum() == 0) continue;
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int col = 0; col < names.size(); col++) {
                            Cell cell = record.getCell(col);
                            if (cell != null && cell.getCellType() == CellType.FORMULA) throw bad("Excel 不支持公式，请先粘贴为值");
                            row.put(names.get(col), formatter.formatCellValue(cell));
                        }
                        add(rows, row);
                    }
                }
            } else throw bad("仅支持 CSV、XLS、XLSX、JSON 文件");
        } catch (ResponseStatusException error) { throw error;
        } catch (Exception error) { throw bad("文件解析失败，请检查文件格式、表头和编码（CSV 使用 UTF-8）"); }
        if (rows.isEmpty()) throw bad("文件中没有有效知识条目");
        return rows;
    }

    private static void checkHeaders(List<String> headers) {
        if (!headers.containsAll(List.of("title", "destination", "content"))
                || new HashSet<>(headers).size() != headers.size()) {
            throw bad("表头必须包含 title、destination、content，且不能重复");
        }
    }

    private static void add(List<Map<String, Object>> rows, Map<String, Object> row) {
        if (row.values().stream().allMatch(v -> v == null || v.toString().isBlank())) return;
        row.entrySet().removeIf(e -> (e.getKey().equals("chunkSize") || e.getKey().equals("chunkOverlap"))
                && (e.getValue() == null || e.getValue().toString().isBlank()));
        rows.add(row);
        if (rows.size() > 100) throw bad("每次最多导入 100 条知识，请拆分文件");
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
