import { ReactNode } from "react";

import { GeneratedGuide } from "./guideTypes";

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

type GeneratedGuideViewProps = {
  guide: GeneratedGuide;
  enhancementStatus: ReactNode;
  isEnhanced: boolean;
};

export function GeneratedGuideView({
  guide,
  enhancementStatus,
  isEnhanced
}: GeneratedGuideViewProps) {
  const riskTips = (guide.riskTips || []).filter(isDisplayableText);

  return (
    <section className="generated-guide" aria-live="polite">
      <p className="eyebrow">
        {isEnhanced ? "真实体验攻略已完成" : "基础攻略已生成"}
      </p>
      {isDisplayableText(guide.title) ? <h2>{guide.title}</h2> : null}
      {isDisplayableText(guide.summary) ? <p>{guide.summary}</p> : null}

      {enhancementStatus}

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

      {riskTips.length ? (
        <div className="generated-guide-risks">
          <strong>出行提醒</strong>
          <ul>
            {riskTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
