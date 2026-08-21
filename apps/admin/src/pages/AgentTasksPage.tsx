import { Button, Table } from "antd";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
const data = [
  {
    key: "AGT-7314",
    agent: "自然语言攻略",
    request: "成都三日游",
    duration: "7.8s",
    attempts: 1,
    status: "成功",
    started: "14:36:22"
  },
  {
    key: "AGT-7313",
    agent: "小红书增强",
    request: "杭州两日骑行",
    duration: "18.2s",
    attempts: 1,
    status: "运行中",
    started: "14:35:09"
  },
  {
    key: "AGT-7312",
    agent: "自然语言攻略",
    request: "东京亲子五日游",
    duration: "60.0s",
    attempts: 2,
    status: "失败",
    started: "14:21:46"
  },
  {
    key: "AGT-7311",
    agent: "RAG 索引",
    request: "KB-1282",
    duration: "2.6s",
    attempts: 1,
    status: "成功",
    started: "13:58:13"
  }
];
export function AgentTasksPage() {
  const columns = [
    { title: "任务 ID", dataIndex: "key" },
    { title: "Agent", dataIndex: "agent" },
    { title: "请求摘要", dataIndex: "request" },
    { title: "耗时", dataIndex: "duration" },
    { title: "尝试", dataIndex: "attempts" },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: string) => (
        <StatusPill tone={value === "成功" ? "success" : value === "运行中" ? "info" : "danger"}>
          {value}
        </StatusPill>
      )
    },
    { title: "开始时间", dataIndex: "started" },
    {
      title: "",
      render: (_: unknown, row: (typeof data)[number]) => (
        <Button type="link">{row.status === "失败" ? "重试" : "查看"}</Button>
      )
    }
  ];
  return (
    <>
      <PageHeader title="Agent 任务" description="查看生成、增强与向量索引任务的运行状态。" />
      <section className="panel table-panel">
        <Table columns={columns} dataSource={data} pagination={false} scroll={{ x: 860 }} />
      </section>
    </>
  );
}
