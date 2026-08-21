import { EnhancementPhase } from "./guideTypes";

type GuideEnhancementStatusProps = {
  phase: EnhancementPhase;
  totalLocations: number;
  sourceNoteCount: number;
  onRetry: () => void;
};

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
        <span className="enhancement-spinner" aria-hidden="true" />
        <span>正在分析 {totalLocations || "行程中的"} 个地点的真实游客笔记…</span>
      </aside>
    );
  }

  if (phase === "failed") {
    return (
      <aside className="guide-enhancement is-degraded" role="status">
        <span>真实游客内容暂时无法获取，不影响当前攻略使用。</span>
        <button onClick={onRetry} type="button">
          重新尝试增强
        </button>
      </aside>
    );
  }

  return (
    <aside className="guide-enhancement is-completed" aria-live="polite">
      <span className="enhancement-check" aria-hidden="true">
        ✓
      </span>
      <span>
        已优化 {totalLocations} 个地点
        {sourceNoteCount > 0 ? `，参考 ${sourceNoteCount} 篇真实笔记` : ""}
      </span>
    </aside>
  );
}
