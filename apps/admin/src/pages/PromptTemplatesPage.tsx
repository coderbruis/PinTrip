import { Button } from "antd";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";

const templates = [
  {
    name: "行程生成",
    key: "itinerary-generation",
    version: "v2.4",
    description: "整合旅行意图、景点、天气和用户历史攻略，生成结构化行程。",
    updated: "今天 12:14",
    status: "生产中"
  },
  {
    name: "旅行意图解析",
    key: "intent-resolution",
    version: "v1.7",
    description: "从自然语言提取目的地、天数、偏好和约束条件。",
    updated: "08-18 17:30",
    status: "生产中"
  },
  {
    name: "小红书证据合并",
    key: "xhs-guide-merger",
    version: "v1.3",
    description: "将真实笔记与评论证据合并进基础攻略。",
    updated: "08-16 10:05",
    status: "草稿"
  }
];

export function PromptTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Prompt 模板"
        description="管理 Agent 指令版本；当前页面为 UI 骨架，尚未连接模型配置。"
        actions={<Button type="primary">新建模板</Button>}
      />
      <div className="template-grid">
        {templates.map((item) => (
          <article className="panel template-card" key={item.key}>
            <div className="template-top">
              <span className="template-icon">{item.name.slice(0, 1)}</span>
              <StatusPill tone={item.status === "生产中" ? "success" : "neutral"}>
                {item.status}
              </StatusPill>
            </div>
            <h2>{item.name}</h2>
            <code>{item.key}</code>
            <p>{item.description}</p>
            <div className="template-footer">
              <span>
                <b>{item.version}</b> · 更新于 {item.updated}
              </span>
              <Button>编辑模板</Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
