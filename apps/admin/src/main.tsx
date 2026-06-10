import { Layout, Menu, Table, Typography } from "antd";
import { createRoot } from "react-dom/client";
import "antd/dist/reset.css";

const columns = [
  { title: "模块", dataIndex: "module" },
  { title: "职责", dataIndex: "scope" }
];

const data = [
  { key: "imports", module: "导入日志", scope: "小红书素材导入、失败原因、回调状态" },
  { key: "tasks", module: "Agent 任务", scope: "生成任务、重试、耗时、模型输出" },
  { key: "prompts", module: "Prompt 模板", scope: "版本、灰度、回滚" }
];

function AdminApp() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Sider theme="light">
        <Typography.Title level={4} style={{ padding: 16 }}>
          PinTrip Admin
        </Typography.Title>
        <Menu items={[{ key: "dashboard", label: "运营看板" }, { key: "imports", label: "导入日志" }]} />
      </Layout.Sider>
      <Layout.Content style={{ padding: 24 }}>
        <Typography.Title level={2}>后台管理</Typography.Title>
        <Table columns={columns} dataSource={data} pagination={false} />
      </Layout.Content>
    </Layout>
  );
}

createRoot(document.getElementById("root")!).render(<AdminApp />);
