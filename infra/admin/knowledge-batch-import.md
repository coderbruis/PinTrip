# 知识批量导入

在运营后台的知识库页面点击「批量导入」，选择文件后确认。接口为
`POST /api/admin/knowledge/batch-import`，使用 Bearer JWT 和知识库菜单权限，
请求为 `multipart/form-data`，文件字段名为 `file`。

- 支持 UTF-8 CSV（含 BOM）、XLS、XLSX、JSON。
- 每次最多 100 条，文件不超过 5 MB。Excel 读取第一个工作表，不支持公式。
- CSV / Excel 第一行必须包含英文列名 `title`、`destination`、`content`。
- 可选列：`tags`、`chunkSize`、`chunkOverlap`。标签以逗号、分号或 `|` 分隔。
- 标题最多 80 字，目的地最多 40 字，正文 20–20000 字。
- 默认分块 500 字、重叠 80 字。所有条目来源设为运营导入。
- JSON 顶层为对象数组，字段名同上；`tags` 也可传字符串数组。

```json
[
  {
    "title": "成都三日游",
    "destination": "成都",
    "content": "第一天游览人民公园与宽窄巷子，第二天参观博物馆，第三天体验本地美食。",
    "tags": ["美食", "人文"]
  }
]
```

文件结构错误会整批拒绝，不执行入库。合法文件逐条校验、独立入库，返回
`total`、`succeeded`、`failed`、`rows`；每条结果包含记录序号、标题、知识 ID 或失败原因。
记录序号从 1 开始，不含表头和空行。入库成功的知识异步建立索引。

当前不会自动去重；重试时仅上传失败条目。若网络中断导致结果未知，先核对知识列表。
本功能不需要数据库迁移。部署时一并更新 Nginx 上传限制和后端 multipart 配置。
