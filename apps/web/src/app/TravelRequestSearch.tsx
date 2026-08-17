"use client";

import { FormEvent, useState } from "react";

const searchExamples = [
  "成都三天美食游",
  "万宁四天学冲浪",
  "东京五天亲子游",
  "新疆七天自驾",
  "杭州周末轻松游",
  "川西三天看雪山"
];

const unavailableTextMarkers = [
  "数据缺失",
  "数据不足",
  "未返回",
  "暂无",
  "待补充",
  "待生成",
  "待定",
  "警示版"
];

function isDisplayableText(value: string | null | undefined): value is string {
  const normalized = value?.trim();
  return Boolean(
    normalized &&
      !unavailableTextMarkers.some((marker) => normalized.includes(marker))
  );
}

function isDisplayableImage(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//.test(value));
}

type GuideItem = {
  time?: string;
  place?: string;
  activity?: string;
};

type GuideDay = {
  day: number;
  title?: string;
  imageUrl?: string | null;
  items: GuideItem[];
};

type GeneratedGuide = {
  trip_id: string;
  title?: string;
  summary?: string;
  days: GuideDay[];
  budgetSummary?: string;
  riskTips: string[];
};

export function TravelRequestSearch() {
  const [requestText, setRequestText] = useState("");
  const [guide, setGuide] = useState<GeneratedGuide | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedRequest = requestText.trim();
    if (!normalizedRequest || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setGuide(null);

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
      setGuide(payload);
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
          {isLoading ? "生成中…" : "搜索"}
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
        <section className="generated-guide" aria-live="polite">
          <p className="eyebrow">AI 攻略已生成</p>
          {isDisplayableText(guide.title) ? <h2>{guide.title}</h2> : null}
          {isDisplayableText(guide.summary) ? <p>{guide.summary}</p> : null}
          <div className="generated-guide-days">
            {guide.days.map((day) => {
              const items = day.items.filter(
                (item) =>
                  isDisplayableText(item.time) ||
                  isDisplayableText(item.place) ||
                  isDisplayableText(item.activity)
              );
              return (
                <article key={day.day}>
                  {isDisplayableImage(day.imageUrl) ? (
                    <img
                      alt={
                        isDisplayableText(day.title)
                          ? day.title
                          : `第 ${day.day} 天行程`
                      }
                      className="generated-guide-day-image"
                      loading="lazy"
                      src={day.imageUrl}
                    />
                  ) : null}
                  <div className="generated-guide-day-body">
                    <h3>
                      第 {day.day} 天
                      {isDisplayableText(day.title) ? ` · ${day.title}` : ""}
                    </h3>
                    {items.length ? (
                      <ol>
                        {items.map((item, index) => (
                          <li key={`${day.day}-${index}`}>
                            {isDisplayableText(item.time) ? (
                              <time>{item.time}</time>
                            ) : null}
                            <div>
                              {isDisplayableText(item.place) ? (
                                <strong>{item.place}</strong>
                              ) : null}
                              {isDisplayableText(item.activity) ? (
                                <p>{item.activity}</p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {isDisplayableText(guide.budgetSummary) ? (
            <p className="generated-guide-budget">预算：{guide.budgetSummary}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
