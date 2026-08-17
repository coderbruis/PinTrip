import { NextResponse } from "next/server";

const DEFAULT_AGENT_URL = "http://127.0.0.1:8091";

export const maxDuration = 120;

function getAgentUrl() {
  return (process.env.NATURAL_LANGUAGE_GUIDE_AGENT_URL || DEFAULT_AGENT_URL).replace(
    /\/$/,
    ""
  );
}

function getAgentError(payload: unknown) {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string") {
      if (detail.includes("Unable to resolve trip intent")) {
        return "无法识别旅行需求，请补充明确的目的地，例如：成都玩三天";
      }
      if (detail.includes("cannot resolve city adcode")) {
        return "无法识别该目的地，请输入城市或地区名称，例如：成都";
      }
      return detail;
    }
  }
  return "Agent 暂时无法生成攻略";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  const prompt =
    body && typeof body === "object" && "prompt" in body
      ? String(body.prompt).trim()
      : "";
  if (!prompt) {
    return NextResponse.json({ error: "请输入旅行需求" }, { status: 400 });
  }
  if (prompt.length > 200) {
    return NextResponse.json(
      { error: "旅行需求不能超过 200 个字符" },
      { status: 400 }
    );
  }

  try {
    const agentResponse = await fetch(
      `${getAgentUrl()}/agent/natural-language-guide/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: `web-${crypto.randomUUID()}`,
          prompt
        }),
        cache: "no-store"
      }
    );
    const payload: unknown = await agentResponse.json();
    if (!agentResponse.ok) {
      return NextResponse.json(
        { error: getAgentError(payload) },
        { status: agentResponse.status }
      );
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "无法连接攻略 Agent，请确认 8091 端口服务已启动" },
      { status: 502 }
    );
  }
}
