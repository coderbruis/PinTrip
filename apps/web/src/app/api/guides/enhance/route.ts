import { NextResponse } from "next/server";

const DEFAULT_XHS_AGENT_URL = "http://127.0.0.1:8093";

export const maxDuration = 180;

function getXhsAgentUrl() {
  return (process.env.XHS_GUIDE_AGENT_URL || DEFAULT_XHS_AGENT_URL).replace(
    /\/$/,
    ""
  );
}

function isEnhancementRequest(
  body: unknown
): body is { prompt: string; guide: Record<string, unknown> } {
  if (!body || typeof body !== "object") {
    return false;
  }
  const request = body as Record<string, unknown>;
  return (
    typeof request.prompt === "string" &&
    request.prompt.trim().length > 0 &&
    Boolean(request.guide) &&
    typeof request.guide === "object"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (!isEnhancementRequest(body)) {
    return NextResponse.json(
      { error: "缺少基础攻略或原始旅行需求" },
      { status: 400 }
    );
  }

  const agentUrl = getXhsAgentUrl();

  try {
    const agentResponse = await fetch(
      `${agentUrl}/agent/xhs-guide/enhance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: body.prompt.trim(),
          guide: body.guide
        }),
        cache: "no-store"
      }
    );
    const payload: unknown = await agentResponse.json();
    if (!agentResponse.ok) {
      return unavailableEnhancement(body.guide);
    }
    if (isCompletedEnhancement(payload)) {
      return NextResponse.json({
        ...payload,
        enhancementStatus: "completed"
      });
    }
    return unavailableEnhancement(body.guide);
  } catch {
    return unavailableEnhancement(body.guide);
  }
}

function isCompletedEnhancement(
  payload: unknown
): payload is {
  guide: Record<string, unknown>;
  sourceNoteCount?: number;
} {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "guide" in payload &&
      payload.guide &&
      typeof payload.guide === "object"
  );
}

function unavailableEnhancement(guide: Record<string, unknown>) {
  return NextResponse.json({
    guide,
    sourceNoteCount: 0,
    enhancementStatus: "unavailable"
  });
}
