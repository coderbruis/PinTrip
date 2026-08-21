export type GuideItem = {
  time?: string;
  place?: string;
  activity?: string;
  transport?: string | null;
  tips?: string[];
};

export type GuideDay = {
  day: number;
  title?: string;
  imageUrl?: string | null;
  items: GuideItem[];
};

export type GeneratedGuide = {
  trip_id: string;
  title?: string;
  summary?: string;
  days: GuideDay[];
  budgetSummary?: string;
  riskTips?: string[];
  sourceNoteIds?: string[];
};

export type GuideEnhancementResponse = {
  guide: GeneratedGuide;
  sourceNoteCount?: number;
  enhancementStatus: "completed" | "unavailable";
};

export type EnhancementPhase = "idle" | "enhancing" | "completed" | "failed";

export function countGuideLocations(guide: GeneratedGuide): number {
  const locations = new Set(
    guide.days.flatMap((day) =>
      day.items.map((item) => item.place?.trim()).filter((place): place is string => Boolean(place))
    )
  );
  return locations.size;
}
