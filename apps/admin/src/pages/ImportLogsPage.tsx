import { Button, Table } from "antd";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
const data = [
  {
    key: "IMP-0821",
    file: "chengdu-guides-0821.xlsx",
    operator: "运营管理员",
    total: 29,
    result: "26 成功 / 3 跳过",
    status: "已完成",
    created: "今天 14:10"
  },
  {
    key: "IMP-0820",
    file: "hangzhou-notes.json",
    operator: "内容运营 A",
    total: 48,
    result: "48 成功",
    status: "已完成",
    created: "昨天 18:42"
  },
  {
    key: "IMP-0819",
    file: "tokyo-family.csv",
    operator: "内容运营 B",
    total: 16,
    result: "12 成功 / 4 失败",
    status: "部分失败",
    created: "08-19 11:26"
  }
];
export function ImportLogsPage() {
  const columns = [
    { title: "任务 ID", dataIndex: "key" },
    { title: "文件", dataIndex: "file" },
    { title: "操作人", dataIndex: "operator" },
    { title: "条目数", dataIndex: "total" },
    { title: "处理结果", dataIndex: "result" },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: string) => (
        <StatusPill tone={value === "已完成" ? "success" : "danger"}>{value}</StatusPill>
      )
    },
    { title: "创建时间", dataIndex: "created" },
    { title: "", render: () => <Button type="link">详情</Button> }
  ];
  return (
    <>
      <PageHeader
        title="导入日志"
        description="追踪平台素材的解析、校验和知识库入库结果。"
        actions={<Button type="primary">新建导入</Button>}
      />
      <section className="panel table-panel">
        <Table columns={columns} dataSource={data} pagination={false} scroll={{ x: 900 }} />
      </section>
    </>
  );
}
