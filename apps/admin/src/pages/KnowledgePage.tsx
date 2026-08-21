import { Button, Input, Select, Table } from "antd";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
const data = [
  {
    key: "KB-1284",
    title: "成都低强度美食三日游",
    destination: "成都",
    source: "运营导入",
    chunks: 12,
    status: "已发布",
    updated: "2026-08-21 14:32"
  },
  {
    key: "KB-1283",
    title: "东京亲子五日路线",
    destination: "东京",
    source: "用户沉淀",
    chunks: 18,
    status: "待审核",
    updated: "2026-08-21 13:08"
  },
  {
    key: "KB-1282",
    title: "杭州秋季骑行攻略",
    destination: "杭州",
    source: "运营导入",
    chunks: 9,
    status: "索引中",
    updated: "2026-08-21 11:45"
  },
  {
    key: "KB-1281",
    title: "泉州古城人文路线",
    destination: "泉州",
    source: "用户沉淀",
    chunks: 11,
    status: "已发布",
    updated: "2026-08-20 19:16"
  }
];
export function KnowledgePage() {
  const columns = [
    {
      title: "知识条目",
      dataIndex: "title",
      render: (value: string, row: (typeof data)[number]) => (
        <div className="table-title">
          <strong>{value}</strong>
          <small>{row.key}</small>
        </div>
      )
    },
    { title: "目的地", dataIndex: "destination" },
    { title: "来源", dataIndex: "source" },
    { title: "分块数", dataIndex: "chunks" },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: string) => (
        <StatusPill tone={value === "已发布" ? "success" : value === "待审核" ? "warning" : "info"}>
          {value}
        </StatusPill>
      )
    },
    { title: "更新时间", dataIndex: "updated" },
    { title: "", key: "action", render: () => <Button type="link">查看</Button> }
  ];
  return (
    <>
      <PageHeader
        title="知识库"
        description="管理平台攻略、用户沉淀内容与向量索引状态。"
        actions={<Button type="primary">导入攻略</Button>}
      />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <Input.Search placeholder="搜索标题或知识 ID" allowClear />
          <Select
            defaultValue="all"
            options={[
              { value: "all", label: "全部状态" },
              { value: "published", label: "已发布" },
              { value: "review", label: "待审核" }
            ]}
          />
          <Select
            defaultValue="all"
            options={[
              { value: "all", label: "全部来源" },
              { value: "operator", label: "运营导入" },
              { value: "user", label: "用户沉淀" }
            ]}
          />
        </div>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          scroll={{ x: 900 }}
        />
      </section>
    </>
  );
}
