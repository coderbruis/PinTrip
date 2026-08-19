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
  const galleryImages = Array.from(
    new Map<string, string>(
      guide.days
        .filter((day) => isDisplayableImage(day.imageUrl))
        .map(
          (day) =>
            [day.imageUrl as string, day.title || `第 ${day.day} 天`] as const
        )
    )
  ).slice(0, 3);

  return (
    <section className="generated-guide" aria-live="polite">
      <p className="guide-answer-label">
        <span aria-hidden="true">✦</span>
        {isEnhanced ? "AI 已结合真实笔记优化" : "AI 已生成攻略"}
      </p>
      {isDisplayableText(guide.title) ? <h2>{guide.title}</h2> : null}
      {isDisplayableText(guide.summary) ? <p>{guide.summary}</p> : null}

      {enhancementStatus}

      {galleryImages.length ? (
        <div className="generated-guide-gallery" aria-label="行程景点图片">
          {galleryImages.map(([url, alt]) => (
            <img key={url} alt={alt} loading="lazy" src={url} />
          ))}
        </div>
      ) : null}

      <h3 className="generated-guide-section-title">
        {guide.days.length} 日精华行程路线
      </h3>

      <div className="generated-guide-days">
        {guide.days.map((day) => {
          const items = day.items.filter(
            (item) =>
              isDisplayableText(item.time) ||
              isDisplayableText(item.place) ||
              isDisplayableText(item.activity) ||
              isDisplayableText(item.transport) ||
              (item.tips || []).some(isDisplayableText)
          );
          return (
            <article key={day.day}>
              <div className="generated-guide-day-body">
                <h3>
                  Day {day.day}
                  {isDisplayableText(day.title) ? `：${day.title}` : ""}
                </h3>
                {items.length ? (
                  <ol>
                    {items.map((item, index) => {
                      const tips = (item.tips || []).filter(isDisplayableText);
                      return (
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
                            {isDisplayableText(item.transport) ? (
                              <p className="generated-guide-transport">
                                交通：{item.transport}
                              </p>
                            ) : null}
                            {tips.length ? (
                              <ul className="generated-guide-item-tips">
                                {tips.map((tip) => (
                                  <li key={tip}>{tip}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </div>
              {isDisplayableImage(day.imageUrl) ? (
                <img
                  alt={day.title || `第 ${day.day} 天行程`}
                  className="generated-guide-day-image"
                  loading="lazy"
                  src={day.imageUrl}
                />
              ) : null}
            </article>
          );
        })}
      </div>

      {isDisplayableText(guide.budgetSummary) ? (
        <section className="generated-guide-advice">
          <h3>预算参考</h3>
          <p>{guide.budgetSummary}</p>
        </section>
      ) : null}

      {riskTips.length ? (
        <section className="generated-guide-risks">
          <h3>出行提醒与实用贴士</h3>
          <ul>
            {riskTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="generated-guide-followup">
        还想调整节奏、交通或住宿偏好吗？可以继续告诉我。
      </p>
    </section>
  );
}
