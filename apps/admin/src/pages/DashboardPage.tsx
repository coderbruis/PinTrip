import { Button, Progress } from "antd";
import { AppIcon } from "../components/AppIcon";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import type { AdminPageKey } from "../types";
const stats = [
  {
    label: "平台知识条目",
    value: "1,284",
    change: "+12.5%",
    detail: "本月新增 143 条",
    accent: "purple"
  },
  { label: "今日生成任务", value: "326", change: "+8.2%", detail: "成功率 96.8%", accent: "blue" },
  {
    label: "待审核攻略",
    value: "18",
    change: "需处理",
    detail: "其中 5 条已等待超 24h",
    accent: "orange"
  },
  {
    label: "平均响应耗时",
    value: "8.4s",
    change: "-1.3s",
    detail: "较上周持续改善",
    accent: "green"
  }
];
const activities = [
  { title: "成都美食三日游已发布", meta: "平台知识库 · 2 分钟前", tone: "success" as const },
  {
    title: "小红书素材批次 #IMP-0821 完成",
    meta: "导入 26 条，跳过 3 条 · 18 分钟前",
    tone: "info" as const
  },
  {
    title: "Agent 任务 #AGT-7312 等待重试",
    meta: "模型响应超时 · 32 分钟前",
    tone: "warning" as const
  },
  {
    title: "行程生成 Prompt 发布 v2.4",
    meta: "operator@pintrip.cn · 1 小时前",
    tone: "neutral" as const
  }
];
export function DashboardPage({ onNavigate }: { onNavigate: (page: AdminPageKey) => void }) {
  return (
    <>
      <PageHeader
        title="运营看板"
        description="掌握内容沉淀、Agent 运行和平台知识健康度。"
        actions={
          <Button type="primary" onClick={() => onNavigate("knowledge")}>
            进入知识库
          </Button>
        }
      />
      <div className="stat-grid">
        {stats.map((stat) => (
          <article className={`stat-card ${stat.accent}`} key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <b>{stat.change}</b>
            </div>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>最近动态</h2>
              <p>平台近 24 小时的重要操作</p>
            </div>
            <Button type="text">查看全部</Button>
          </div>
          <div className="activity-list">
            {activities.map((item) => (
              <div className="activity-item" key={item.title}>
                <StatusPill tone={item.tone}>
                  {item.tone === "success" ? "发布" : item.tone === "warning" ? "告警" : "更新"}
                </StatusPill>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <button aria-label="查看详情">
                  <AppIcon name="arrow" size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel health-panel">
          <div className="panel-heading">
            <div>
              <h2>服务健康度</h2>
              <p>演示数据 · 尚未接入监控接口</p>
            </div>
            <StatusPill tone="success">运行正常</StatusPill>
          </div>
          <div className="health-row">
            <span>自然语言攻略 Agent</span>
            <Progress percent={98} showInfo={false} strokeColor="#6d5dfc" />
            <b>98%</b>
          </div>
          <div className="health-row">
            <span>小红书增强 Agent</span>
            <Progress percent={93} showInfo={false} strokeColor="#2563eb" />
            <b>93%</b>
          </div>
          <div className="health-row">
            <span>RAG 向量检索</span>
            <Progress percent={99} showInfo={false} strokeColor="#10b981" />
            <b>99%</b>
          </div>
          <div className="health-note">
            <strong>3 个服务在线</strong>
            <p>最近一次检查：刚刚</p>
          </div>
        </section>
      </div>
    </>
  );
}
