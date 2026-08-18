import { EnhancementPhase } from "./guideTypes";

type GuideEnhancementStatusProps = {
  phase: EnhancementPhase;
  totalLocations: number;
  sourceNoteCount: number;
  onRetry: () => void;
};

const completedEnhancements = [
  "已加入真实游客建议",
  "已补充避坑信息",
  "已优化游玩时间",
  "已整理图片和参考来源"
];

export function GuideEnhancementStatus({
  phase,
  totalLocations,
  sourceNoteCount,
  onRetry
}: GuideEnhancementStatusProps) {
  if (phase === "idle") {
    return null;
  }

  if (phase === "enhancing") {
    return (
      <aside className="guide-enhancement is-running" aria-live="polite">
        <div className="enhancement-heading">
          <span className="enhancement-spinner" aria-hidden="true" />
          <div>
            <strong>正在参考真实游客笔记优化</strong>
            <p>
              正在检索并分析 {totalLocations || "行程中的"} 个地点，基础攻略可先查看
            </p>
          </div>
        </div>
        <div className="enhancement-progress" aria-label="小红书内容增强处理中">
          <span />
        </div>
      </aside>
    );
  }

  if (phase === "failed") {
    return (
      <aside className="guide-enhancement is-degraded" role="status">
        <div>
          <strong>基础攻略已生成</strong>
          <p>真实游客内容暂时无法获取，不影响当前攻略使用。</p>
        </div>
        <button onClick={onRetry} type="button">
          重新尝试增强
        </button>
      </aside>
    );
  }

  return (
    <aside className="guide-enhancement is-completed" aria-live="polite">
      <div className="enhancement-heading">
        <span className="enhancement-check" aria-hidden="true">
          ✓
        </span>
        <div>
          <strong>真实体验增强完成</strong>
          <p>
            已优化 {totalLocations} 个地点
            {sourceNoteCount > 0 ? `，参考 ${sourceNoteCount} 篇笔记` : ""}
          </p>
        </div>
      </div>
      <div className="enhancement-tags">
        {completedEnhancements.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </aside>
  );
}
