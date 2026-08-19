from uuid import NAMESPACE_URL, uuid5

from ..models import GeneratedItinerary, IndexUserGuideRequest
from .models import GuideChunk, IndexedGuide
from .ports import GuideIndexStore


class UserGuideChunker:
    def split(
        self,
        *,
        user_id: str,
        guide_id: str,
        revision: int,
        destination: str,
        guide: GeneratedItinerary,
    ) -> list[GuideChunk]:
        chunks: list[GuideChunk] = []
        context = f"攻略：{guide.title}\n目的地：{destination}"

        if guide.summary:
            chunks.append(
                self._chunk(
                    user_id,
                    guide_id,
                    revision,
                    len(chunks),
                    "guide_summary",
                    f"{context}\n摘要：{guide.summary}",
                    destination,
                )
            )

        for day in guide.days:
            day_lines = [f"第{day.day}天：{day.title}"]
            for item in day.items:
                details = f"{item.time} {item.place}：{item.activity}"
                if item.transport:
                    details += f"；交通：{item.transport}"
                if item.tips:
                    details += f"；提示：{'；'.join(item.tips)}"
                day_lines.append(details)
            chunks.append(
                self._chunk(
                    user_id,
                    guide_id,
                    revision,
                    len(chunks),
                    "guide_day",
                    "\n".join([context, *day_lines]),
                    destination,
                )
            )

            for item in day.items:
                item_lines = [
                    context,
                    f"第{day.day}天：{day.title}",
                    f"地点：{item.place}",
                    f"时间：{item.time}",
                    f"活动：{item.activity}",
                ]
                if item.transport:
                    item_lines.append(f"交通：{item.transport}")
                if item.tips:
                    item_lines.append(f"提示：{'；'.join(item.tips)}")
                chunks.append(
                    self._chunk(
                        user_id,
                        guide_id,
                        revision,
                        len(chunks),
                        "place_experience",
                        "\n".join(item_lines),
                        destination,
                        item.place,
                    )
                )

        if guide.budget_summary:
            chunks.append(
                self._chunk(
                    user_id,
                    guide_id,
                    revision,
                    len(chunks),
                    "budget",
                    f"{context}\n预算：{guide.budget_summary}",
                    destination,
                )
            )
        if guide.risk_tips:
            chunks.append(
                self._chunk(
                    user_id,
                    guide_id,
                    revision,
                    len(chunks),
                    "risk_tip",
                    f"{context}\n风险与提示：{'；'.join(guide.risk_tips)}",
                    destination,
                )
            )
        return chunks

    @staticmethod
    def _chunk(
        user_id: str,
        guide_id: str,
        revision: int,
        ordinal: int,
        chunk_type: str,
        content: str,
        destination: str,
        place: str | None = None,
    ) -> GuideChunk:
        identity = f"pintrip:{user_id}:{guide_id}:{revision}:{ordinal}:{chunk_type}"
        return GuideChunk(
            chunk_id=str(uuid5(NAMESPACE_URL, identity)),
            guide_id=guide_id,
            chunk_type=chunk_type,
            content=content,
            destination=destination,
            place=place,
        )


class UserGuideIndexer:
    def __init__(
        self,
        store: GuideIndexStore,
        chunker: UserGuideChunker | None = None,
    ):
        self._store = store
        self._chunker = chunker or UserGuideChunker()

    def index(self, request: IndexUserGuideRequest) -> int:
        chunks = self._chunker.split(
            user_id=request.user_id,
            guide_id=request.guide_id,
            revision=request.revision,
            destination=request.destination,
            guide=request.guide,
        )
        return self._store.replace_guide(
            IndexedGuide(
                user_id=request.user_id,
                guide_id=request.guide_id,
                revision=request.revision,
                destination=request.destination,
                payload=request.guide.model_dump(by_alias=True),
                chunks=chunks,
            )
        )
