import re

from ...models import ResolvedTripIntent, normalize_destination


ROUTE_SEPARATOR_PATTERN = re.compile(r"[-—–→、]")
CHINESE_NUMBER_PATTERN = r"[一二两三四五六七八九十百]+"
DAYS_PATTERN = rf"(?P<days>\d{{1,2}}|{CHINESE_NUMBER_PATTERN})[天日]"
DIRECT_DESTINATION_PATTERN = re.compile(
    rf"^(?P<destination>[\u4e00-\u9fff]{{2,12}}?){DAYS_PATTERN}"
)
GO_DESTINATION_PATTERN = re.compile(
    rf"(?:去|到)(?P<destination>[\u4e00-\u9fff]{{2,12}}?)"
    rf"(?:玩|旅游|旅行|自由行){DAYS_PATTERN}"
)
PLAY_DESTINATION_PATTERN = re.compile(
    rf"^(?P<destination>[\u4e00-\u9fff]{{2,12}}?)"
    rf"(?:玩|旅游|旅行|自由行){DAYS_PATTERN}"
)

CHINESE_DIGITS = {
    "一": 1,
    "二": 2,
    "两": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
}

PREFERENCE_MARKERS = (
    "美食",
    "人文",
    "亲子",
    "摄影",
    "拍照",
    "徒步",
    "自然",
    "历史",
    "购物",
    "咖啡",
    "海边",
    "雪山",
)


def parse_simple_trip_intent(prompt: str) -> ResolvedTripIntent | None:
    """Parse only unambiguous single-destination prompts; defer the rest to LLM."""
    normalized = prompt.strip()
    if not normalized or ROUTE_SEPARATOR_PATTERN.search(normalized):
        return None

    match = GO_DESTINATION_PATTERN.search(normalized)
    if match is None:
        match = DIRECT_DESTINATION_PATTERN.search(normalized)
    if match is None:
        match = PLAY_DESTINATION_PATTERN.search(normalized)
    if match is None:
        return None

    days = _parse_days(match.group("days"))
    if not 1 <= days <= 30:
        return None

    preferences = [
        marker for marker in PREFERENCE_MARKERS if marker in normalized
    ]
    return ResolvedTripIntent(
        destination=normalize_destination(match.group("destination")),
        days=days,
        transportation=_resolve_transportation(normalized),
        accommodation="舒适型酒店",
        preferences=preferences,
        requirements=[],
    )


def _parse_days(value: str) -> int:
    if value.isdigit():
        return int(value)
    if value in CHINESE_DIGITS:
        return CHINESE_DIGITS[value]
    if value.startswith("十"):
        return 10 + CHINESE_DIGITS.get(value[1:], 0)
    if "十" in value:
        tens, ones = value.split("十", 1)
        return CHINESE_DIGITS.get(tens, 0) * 10 + CHINESE_DIGITS.get(ones, 0)
    return 0


def _resolve_transportation(prompt: str) -> str:
    if "自驾" in prompt:
        return "自驾"
    if "高铁" in prompt:
        return "高铁"
    if "租车" in prompt:
        return "租车"
    return "公共交通"
