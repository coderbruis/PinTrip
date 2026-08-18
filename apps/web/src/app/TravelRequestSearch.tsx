"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { GeneratedGuideView } from "./GeneratedGuideView";
import { GuideEnhancementStatus } from "./GuideEnhancementStatus";
import {
  countGuideLocations,
  EnhancementPhase,
  GeneratedGuide,
  GuideEnhancementResponse
} from "./guideTypes";

const searchExamples = [
  "成都三天美食游",
  "万宁四天学冲浪",
  "东京五天亲子游",
  "新疆七天自驾",
  "杭州周末轻松游",
  "川西三天看雪山"
];

export function TravelRequestSearch() {
  const [requestText, setRequestText] = useState("");
  const [guide, setGuide] = useState<GeneratedGuide | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enhancementPhase, setEnhancementPhase] =
    useState<EnhancementPhase>("idle");
  const [sourceNoteCount, setSourceNoteCount] = useState(0);
  const [activePrompt, setActivePrompt] = useState("");
  const enhancementRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => enhancementRequest.current?.abort();
  }, []);

  async function enhanceGuide(baseGuide: GeneratedGuide, prompt: string) {
    enhancementRequest.current?.abort();
    const controller = new AbortController();
    enhancementRequest.current = controller;
    setEnhancementPhase("enhancing");
    setSourceNoteCount(0);

    try {
      const response = await fetch("/api/guides/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, guide: baseGuide }),
        signal: controller.signal
      });
      const payload = (await response.json()) as
        | GuideEnhancementResponse
        | { error?: string };
      if (!response.ok || !("guide" in payload)) {
        throw new Error("小红书内容增强暂不可用");
      }
      if (payload.enhancementStatus === "unavailable") {
        setEnhancementPhase("failed");
        return;
      }
      setGuide(payload.guide);
      setSourceNoteCount(
        payload.sourceNoteCount ?? payload.guide.sourceNoteIds?.length ?? 0
      );
      setEnhancementPhase("completed");
    } catch (enhancementError) {
      if (
        enhancementError instanceof DOMException &&
        enhancementError.name === "AbortError"
      ) {
        return;
      }
      setEnhancementPhase("failed");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedRequest = requestText.trim();
    if (!normalizedRequest || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setGuide(null);
    setEnhancementPhase("idle");
    setSourceNoteCount(0);
    setActivePrompt(normalizedRequest);
    enhancementRequest.current?.abort();

    try {
      const response = await fetch("/api/guides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: normalizedRequest })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "攻略生成失败，请稍后重试");
      }
      const baseGuide = payload as GeneratedGuide;
      setGuide(baseGuide);
      void enhanceGuide(baseGuide, normalizedRequest);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "攻略生成失败，请稍后重试"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="travel-request-search">
      <form className="search-bar" onSubmit={handleSubmit}>
        <span className="search-label">旅行需求</span>
        <input
          aria-label="旅行需求"
          autoComplete="off"
          maxLength={200}
          name="prompt"
          onChange={(event) => setRequestText(event.target.value)}
          placeholder="例如：成都玩三天，喜欢美食，公共交通"
          required
          type="search"
          value={requestText}
        />
        <button disabled={isLoading} type="submit">
          {isLoading ? "生成基础攻略…" : "搜索"}
        </button>
      </form>

      <div className="quick-tags" aria-label="热门旅行需求示例">
        {searchExamples.map((label) => (
          <button key={label} onClick={() => setRequestText(label)} type="button">
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="search-message search-error" role="alert">
          {error}
        </p>
      ) : null}

      {guide ? (
        <GeneratedGuideView
          enhancementStatus={
            <GuideEnhancementStatus
              onRetry={() => void enhanceGuide(guide, activePrompt)}
              phase={enhancementPhase}
              sourceNoteCount={sourceNoteCount}
              totalLocations={countGuideLocations(guide)}
            />
          }
          guide={guide}
          isEnhanced={enhancementPhase === "completed"}
        />
      ) : null}
    </div>
  );
}
