import { Alert, Button, Modal, Space, Table, Typography, message } from "antd";
import { useState } from "react";
import { importKnowledgeFile, type BatchImportResult } from "../services/knowledgeApi";

export function KnowledgeBatchImport({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BatchImportResult>();
  const [uncertain, setUncertain] = useState(false);
  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      setResult(await importKnowledgeFile(file));
      onImported();
    } catch (error) {
      setUncertain(true);
      message.error(error instanceof Error ? error.message : "批量导入失败");
      onImported();
    } finally {
      setBusy(false);
    }
  };
  const template = () => {
    const blob = new Blob(
      [
        "\uFEFFtitle,destination,content,tags\r\n成都三日游,成都,第一天游览成都人民公园与宽窄巷子，第二天参观博物馆，第三天体验本地美食。,美食|人文\r\n"
      ],
      { type: "text/csv;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "知识导入模板.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Button
        onClick={() => {
          setFile(undefined);
          setResult(undefined);
          setUncertain(false);
          setOpen(true);
        }}
      >
        批量导入
      </Button>
      <Modal
        title="批量导入攻略知识"
        open={open}
        width={800}
        onCancel={() => {
          if (!busy) setOpen(false);
        }}
        closable={!busy}
        maskClosable={!busy}
        footer={
          <Space>
            <Button disabled={busy} onClick={() => setOpen(false)}>
              关闭
            </Button>
            <Button
              type="primary"
              loading={busy}
              disabled={!file || Boolean(result) || uncertain}
              onClick={() => void submit()}
            >
              确认导入
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph>
          支持 UTF-8 CSV、Excel（.xls / .xlsx，第一个工作表）和 JSON 数组。每次最多 100 条、5
          MB；正文至少 20 字。CSV / Excel 第一行为英文表头。
        </Typography.Paragraph>
        <Typography.Paragraph>
          必填：title（标题）、destination（目的地）、content（正文）。可选：tags（标签，用逗号、分号或
          | 分隔；JSON 也支持数组）、chunkSize、chunkOverlap。默认分块长度 500、重叠 80。
        </Typography.Paragraph>
        <Button onClick={template}>下载 CSV 模板（可用 Excel 打开）</Button>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {
            '[ { "title": "成都三日游", "destination": "成都", "content": "第一天游览人民公园与宽窄巷子，第二天参观博物馆，第三天体验本地美食。", "tags": ["美食"] } ]'
          }
        </pre>
        <input
          aria-label="选择知识导入文件"
          type="file"
          accept=".csv,.xls,.xlsx,.json"
          disabled={busy || Boolean(result) || uncertain}
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next && (next.size === 0 || next.size > 5 * 1024 * 1024)) {
              message.error("请选择非空且不超过 5 MB 的文件");
              event.target.value = "";
              setFile(undefined);
              return;
            }
            setFile(next);
          }}
        />
        <Typography.Paragraph type="secondary">
          确认后有效条目立即入库并异步建立索引，无效条目会显示原因。不会自动去重，请仅重新上传失败条目。
        </Typography.Paragraph>
        {uncertain && (
          <Alert
            type="warning"
            showIcon
            message="请求未完成"
            description="请先检查知识列表，确认是否已有条目入库，再重新打开窗口导入剩余条目，避免重复。"
          />
        )}
        {result && (
          <>
            <Alert
              type={result.failed ? "warning" : "success"}
              showIcon
              message={`共 ${result.total} 条，入库成功 ${result.succeeded} 条，失败 ${result.failed} 条`}
              description="入库成功不代表索引完成，请在知识列表查看索引状态。记录序号不含表头和空行。"
            />
            <Table
              rowKey="row"
              size="small"
              dataSource={result.rows}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "记录", dataIndex: "row", width: 65 },
                { title: "标题", dataIndex: "title" },
                { title: "知识 ID", dataIndex: "knowledgeId" },
                { title: "结果", render: (_, row) => row.error ?? "入库成功" }
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}
