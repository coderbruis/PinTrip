import { Empty, Tabs, Tag } from "antd";
import { PageHeader } from "../components/PageHeader";

const pageCopy = {
  menus: {
    title: "菜单与权限",
    description: "统一维护后台菜单、页面权限和操作权限。"
  },
  users: {
    title: "用户管理",
    description: "管理运营后台账号、启停状态和所属角色。"
  },
  roles: {
    title: "角色管理",
    description: "配置角色及其菜单权限、数据权限和操作权限。"
  }
} as const;

function PendingPanel({ text }: { text: string }) {
  return (
    <section className="panel system-placeholder">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text} />
      <Tag color="purple">接口待接入</Tag>
    </section>
  );
}

export function SystemManagementPage({ page }: { page: "roles" | "logs" }) {
  if (page === "logs") {
    return (
      <>
        <PageHeader title="日志记录" description="审计后台操作和账号登录行为，便于安全追踪与问题排查。" />
        <section className="panel system-tabs">
          <Tabs
            items={[
              { key: "operation", label: "操作日志", children: <PendingPanel text="操作日志接口接入后，将展示操作人、模块、动作、结果和时间。" /> },
              { key: "login", label: "登录日志", children: <PendingPanel text="登录日志接口接入后，将展示账号、IP、设备、登录结果和时间。" /> }
            ]}
          />
        </section>
      </>
    );
  }

  const copy = pageCopy[page];
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <PendingPanel text={`${copy.title}页面结构已建立，等待后端管理接口接入。`} />
    </>
  );
}
