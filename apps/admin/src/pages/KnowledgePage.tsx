import {
  Alert,
  Button,
  Collapse,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { KnowledgeBatchImport } from "../components/KnowledgeBatchImport";
import { StatusPill } from "../components/StatusPill";
import {
  importKnowledge,
  deleteKnowledge,
  listKnowledge,
  offlineKnowledge,
  previewKnowledge,
  reindexKnowledge,
  updateKnowledge,
  type ChunkPreview,
  type ImportKnowledgePayload,
  type KnowledgeItem,
  type KnowledgeStatus,
  type UpdateKnowledgePayload
} from "../services/knowledgeApi";

type ImportStep = "editing" | "parsing" | "review" | "importing";

const statusOptions: Array<{ value: "all" | KnowledgeStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "published", label: "已发布" },
  { value: "indexing", label: "索引中" },
  { value: "failed", label: "失败" },
  { value: "offline", label: "已下线" }
];

const sourceOptions = [
  { value: "all", label: "全部来源" },
  { value: "operator", label: "运营导入" },
  { value: "user", label: "用户沉淀" }
];

const statusMeta: Record<
  KnowledgeStatus,
  { label: string; tone: "success" | "info" | "danger" | "neutral" }
> = {
  published: { label: "已发布", tone: "success" },
  indexing: { label: "索引中", tone: "info" },
  failed: { label: "失败", tone: "danger" },
  offline: { label: "已下线", tone: "neutral" }
};

function Status({ value }: { value: KnowledgeStatus }) {
  const meta = statusMeta[value];
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
}

export function KnowledgePage() {
  const [form] = Form.useForm<ImportKnowledgePayload>();
  const [editForm] = Form.useForm<UpdateKnowledgePayload>();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("editing");
  const [preview, setPreview] = useState<ChunkPreview>();
  const [payload, setPayload] = useState<ImportKnowledgePayload>();
  const [selected, setSelected] = useState<KnowledgeItem>();
  const [editing, setEditing] = useState<KnowledgeItem>();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | KnowledgeStatus>("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const requestId = useRef(0);

  const loadItems = useCallback(
    async (showLoading = true) => {
      const id = ++requestId.current;
      if (showLoading) setLoading(true);
      try {
        const result = await listKnowledge({
          page,
          pageSize,
          keyword: query,
          status,
          sourceType: source
        });
        if (id !== requestId.current) return;
        const lastPage = Math.max(1, Math.ceil(result.total / pageSize));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setItems(result.items);
        setTotal(result.total);
        setSelected((current) =>
          current ? (result.items.find((item) => item.id === current.id) ?? current) : current
        );
      } catch (error) {
        if (id === requestId.current)
          message.error(error instanceof Error ? error.message : "知识库加载失败");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [page, pageSize, query, status, source]
  );

  useEffect(() => {
    void loadItems();
    return () => {
      requestId.current++;
    };
  }, [loadItems]);

  useEffect(() => {
    if (!items.some((item) => item.status === "indexing")) return;
    const timer = window.setInterval(() => void loadItems(false), 2000);
    return () => window.clearInterval(timer);
  }, [items, loadItems]);

  const openImport = () => {
    form.resetFields();
    setPreview(undefined);
    setPayload(undefined);
    setImportStep("editing");
    setImportOpen(true);
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      setImportStep("parsing");
      const result = await previewKnowledge(values);
      setPayload(values);
      setPreview(result);
      setImportStep("review");
    } catch (error) {
      setImportStep("editing");
      if (error instanceof Error) message.error(error.message);
    }
  };

  const handleImport = async () => {
    if (!payload) return;
    try {
      setImportStep("importing");
      const item = await importKnowledge(payload);
      void loadItems();
      setImportOpen(false);
      message.success(`“${item.title}”已导入知识库，正在建立索引`);
    } catch (error) {
      setImportStep("review");
      message.error(error instanceof Error ? error.message : "导入知识库失败");
    }
  };

  const replaceItem = (item: KnowledgeItem) => {
    void loadItems(false);
    setSelected((current) => (current?.id === item.id ? item : current));
  };

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item);
    editForm.setFieldsValue({
      title: item.title,
      destination: item.destination,
      content: item.content,
      tags: item.tags,
      chunkSize: 500,
      chunkOverlap: 80
    });
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      const item = await updateKnowledge(editing.id, values);
      replaceItem(item);
      setEditing(undefined);
      message.success(`“${item.title}”已更新，正在重新建立索引`);
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOffline = async (item: KnowledgeItem) => {
    try {
      replaceItem(await offlineKnowledge(item.id));
      message.success(`“${item.title}”已下线`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "知识下线失败");
    }
  };

  const handleReindex = async (item: KnowledgeItem) => {
    try {
      replaceItem(await reindexKnowledge(item.id));
      message.success(`“${item.title}”正在重新索引`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "重新索引失败");
    }
  };

  const handleDelete = async (item: KnowledgeItem) => {
    try {
      await deleteKnowledge(item.id);
      setItems((current) => current.filter(({ id }) => id !== item.id));
      void loadItems(false);
      setSelected((current) => (current?.id === item.id ? undefined : current));
      message.success(`“${item.title}”已删除`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除知识失败");
    }
  };

  const columns = [
    {
      title: "知识条目",
      dataIndex: "title",
      render: (value: string, row: KnowledgeItem) => (
        <div className="table-title">
          <strong>{value}</strong>
          <small>{row.id}</small>
        </div>
      )
    },
    { title: "目的地", dataIndex: "destination", width: 120 },
    { title: "来源", dataIndex: "source", width: 130 },
    { title: "分块数", dataIndex: "chunkCount", width: 100 },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (value: KnowledgeStatus) => <Status value={value} />
    },
    { title: "更新时间", dataIndex: "updatedAt", width: 170 },
    {
      title: "操作",
      key: "action",
      width: 260,
      render: (_: unknown, row: KnowledgeItem) => (
        <Space size={0}>
          <Button type="link" onClick={() => setSelected(row)}>
            查看
          </Button>
          <Button type="link" onClick={() => openEdit(row)} disabled={row.status === "indexing"}>
            编辑
          </Button>
          {row.status === "published" ? (
            <Popconfirm
              title="确认下线该知识？"
              description="下线后该条目将退出发布状态。"
              onConfirm={() => void handleOffline(row)}
            >
              <Button type="link">下线</Button>
            </Popconfirm>
          ) : (
            <Button
              type="link"
              onClick={() => void handleReindex(row)}
              disabled={row.status === "indexing"}
            >
              重新索引
            </Button>
          )}
          <Popconfirm
            title="确认删除该知识？"
            description="正文、分块和向量都将被删除，且无法恢复。"
            okButtonProps={{ danger: true }}
            okText="删除"
            onConfirm={() => void handleDelete(row)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="攻略知识库"
        description="导入审核后的攻略内容，查看切块结果与 RAG 向量索引状态。"
        actions={
          <Space>
            <KnowledgeBatchImport onImported={() => void loadItems()} />
            <Button type="primary" onClick={openImport}>
              导入攻略
            </Button>
          </Space>
        }
      />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <Input.Search
            placeholder="搜索标题、目的地或知识 ID"
            allowClear
            maxLength={200}
            onSearch={(value) => {
              setQuery(value.trim());
              setPage(1);
            }}
            onChange={(event) => {
              if (!event.target.value) {
                setQuery("");
                setPage(1);
              }
            }}
          />
          <Select
            value={status}
            options={statusOptions}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <Select
            value={source}
            options={sourceOptions}
            onChange={(value) => {
              setSource(value);
              setPage(1);
            }}
          />
          <Button className="toolbar-refresh" onClick={() => void loadItems()} loading={loading}>
            刷新
          </Button>
        </div>
        <Table<KnowledgeItem>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无知识，请先导入攻略" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [8, 20, 50, 100],
            onChange: (nextPage, size) => {
              setPage(size !== pageSize ? 1 : nextPage);
              setPageSize(size);
            },
            showTotal: (total) => `共 ${total} 条`
          }}
          scroll={{ x: 900 }}
        />
      </section>

      <Modal
        title={
          importStep === "review" || importStep === "importing" ? "确认导入知识库" : "导入攻略知识"
        }
        open={importOpen}
        width={720}
        onCancel={() => setImportOpen(false)}
        destroyOnHidden
        footer={
          importStep === "review" || importStep === "importing"
            ? [
                <Button
                  key="back"
                  disabled={importStep === "importing"}
                  onClick={() => setImportStep("editing")}
                >
                  返回修改
                </Button>,
                <Button
                  key="import"
                  type="primary"
                  loading={importStep === "importing"}
                  onClick={() => void handleImport()}
                >
                  导入知识库
                </Button>
              ]
            : [
                <Button key="cancel" onClick={() => setImportOpen(false)}>
                  取消
                </Button>,
                <Button
                  key="preview"
                  type="primary"
                  loading={importStep === "parsing"}
                  onClick={() => void handlePreview()}
                >
                  解析并预览
                </Button>
              ]
        }
      >
        {importStep === "review" || importStep === "importing" ? (
          <PreviewPanel preview={preview} />
        ) : (
          <>
            <p className="form-intro">
              请导入已审核、可公开复用的攻略。系统会先解析正文并展示切块结果，确认后再写入知识库。
            </p>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ sourceType: "operator", chunkSize: 500, chunkOverlap: 80 }}
            >
              <div className="form-grid">
                <Form.Item
                  name="title"
                  label="攻略标题"
                  rules={[
                    { required: true, message: "请输入攻略标题" },
                    { max: 80, message: "标题不能超过 80 个字" }
                  ]}
                >
                  <Input placeholder="例如：成都低强度美食三日游" showCount maxLength={80} />
                </Form.Item>
                <Form.Item
                  name="destination"
                  label="目的地"
                  rules={[{ required: true, message: "请输入目的地" }]}
                >
                  <Input placeholder="例如：成都" />
                </Form.Item>
              </div>
              <Form.Item
                name="content"
                label="攻略正文"
                rules={[
                  { required: true, message: "请粘贴攻略正文" },
                  { min: 20, message: "正文至少需要 20 个字" }
                ]}
              >
                <Input.TextArea
                  rows={10}
                  placeholder="粘贴已审核的完整攻略，建议使用小标题和分段。"
                  showCount
                  maxLength={20000}
                />
              </Form.Item>
              <Form.Item name="tags" label="标签（可选）">
                <Select
                  mode="tags"
                  tokenSeparators={[",", "，"]}
                  placeholder="输入后回车，例如：美食、亲子、轻松"
                />
              </Form.Item>
              <Form.Item name="sourceType" hidden>
                <Input />
              </Form.Item>
              <Collapse
                ghost
                className="advanced-settings"
                items={[
                  {
                    key: "advanced",
                    label: "高级设置",
                    children: (
                      <div className="form-grid">
                        <Form.Item
                          name="chunkSize"
                          label="分块长度"
                          tooltip="每个知识块的目标字符数"
                        >
                          <InputNumber min={200} max={1200} step={50} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                          name="chunkOverlap"
                          label="重叠长度"
                          tooltip="相邻知识块保留的上下文字符数"
                        >
                          <InputNumber min={0} max={200} step={10} style={{ width: "100%" }} />
                        </Form.Item>
                      </div>
                    )
                  }
                ]}
              />
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title={`编辑知识 · ${editing?.id ?? ""}`}
        open={Boolean(editing)}
        width={720}
        onCancel={() => setEditing(undefined)}
        onOk={() => void handleUpdate()}
        confirmLoading={saving}
        okText="保存并重新索引"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <div className="form-grid">
            <Form.Item
              name="title"
              label="攻略标题"
              rules={[
                { required: true, message: "请输入攻略标题" },
                { max: 80, message: "标题不能超过 80 个字" }
              ]}
            >
              <Input showCount maxLength={80} />
            </Form.Item>
            <Form.Item
              name="destination"
              label="目的地"
              rules={[
                { required: true, message: "请输入目的地" },
                { max: 40, message: "目的地不能超过 40 个字" }
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            name="content"
            label="攻略正文"
            rules={[
              { required: true, message: "请输入攻略正文" },
              { min: 20, message: "正文至少需要 20 个字" }
            ]}
          >
            <Input.TextArea rows={12} showCount maxLength={20000} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" tokenSeparators={[",", "，"]} />
          </Form.Item>
          <Collapse
            ghost
            className="advanced-settings"
            items={[
              {
                key: "advanced",
                label: "重新切块设置",
                children: (
                  <div className="form-grid">
                    <Form.Item name="chunkSize" label="分块长度">
                      <InputNumber min={200} max={1200} step={50} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="chunkOverlap" label="重叠长度">
                      <InputNumber min={0} max={200} step={10} style={{ width: "100%" }} />
                    </Form.Item>
                  </div>
                )
              }
            ]}
          />
        </Form>
      </Modal>

      <Drawer
        title="知识详情"
        width={620}
        open={Boolean(selected)}
        onClose={() => setSelected(undefined)}
      >
        {selected && (
          <div className="knowledge-detail">
            <div className="detail-heading">
              <div>
                <Typography.Title level={3}>{selected.title}</Typography.Title>
                <Typography.Text type="secondary">{selected.id}</Typography.Text>
              </div>
              <Status value={selected.status} />
            </div>
            <div className="detail-meta">
              <span>
                <b>目的地</b>
                {selected.destination}
              </span>
              <span>
                <b>来源</b>
                {selected.source}
              </span>
              <span>
                <b>分块数</b>
                {selected.chunkCount}
              </span>
              <span>
                <b>更新时间</b>
                {selected.updatedAt}
              </span>
            </div>
            {selected.tags.length > 0 && (
              <Space wrap>
                {selected.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            )}
            {selected.errorMessage && (
              <div className="index-error">索引失败：{selected.errorMessage}</div>
            )}
            <Typography.Title level={5}>原始正文</Typography.Title>
            <div className="content-preview">{selected.content}</div>
            <Typography.Title level={5}>RAG 分块预览</Typography.Title>
            <ChunkList chunks={selected.chunks} />
          </div>
        )}
      </Drawer>
    </>
  );
}

function PreviewPanel({ preview }: { preview?: ChunkPreview }) {
  if (!preview) return null;
  return (
    <div className="preview-panel">
      <Alert
        type="success"
        showIcon
        message={`解析完成，共生成 ${preview.chunkCount} 个知识分块`}
        description="请检查段落是否完整、上下文是否连贯。确认后将进入向量索引流程。"
      />
      <Typography.Title level={5}>切块预览</Typography.Title>
      <ChunkList chunks={preview.chunks} />
    </div>
  );
}

function ChunkList({ chunks }: { chunks: string[] }) {
  return (
    <div className="chunk-list">
      {chunks.map((chunk, index) => (
        <div className="chunk-card" key={`${index}-${chunk.slice(0, 12)}`}>
          <b>Chunk {index + 1}</b>
          <p>{chunk}</p>
        </div>
      ))}
    </div>
  );
}
