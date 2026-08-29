import importlib
import json
import sys
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlencode

from ..config import EnhancerConfigurationError, Settings, XhsLoginType
from ..models import Author, CrawledComment, CrawledNote, NoteType, SortBy


class SourceError(RuntimeError):
    """Raised when Spider_XHS cannot return usable source data."""


def _as_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _as_timestamp(value: Any) -> str | None:
    timestamp = _as_int(value)
    if not timestamp:
        return None
    if timestamp > 10_000_000_000:
        timestamp /= 1000
    try:
        return datetime.fromtimestamp(timestamp, tz=UTC).isoformat()
    except (OverflowError, OSError, ValueError):
        return None


class SpiderXhsProvider:
    """Internal adapter around the bundled Spider_XHS checkout."""

    def __init__(self, settings: Settings):
        settings.require_credentials()
        self._proxies = self._parse_proxies(settings.xhs_request_proxies_json)
        self._api = self._create_api(
            settings.spider_xhs_path,
            settings.xhs_login_type,
            settings.xhs_cookies,
            self._proxies,
        )

    @staticmethod
    def _create_api(
        project_path: Any,
        login_type: XhsLoginType,
        cookies: str,
        proxies: dict[str, str] | None,
    ) -> Any:
        path = str(project_path.resolve())
        if path not in sys.path:
            sys.path.insert(0, path)
        try:
            api_module = importlib.import_module("apis.xhs_pc_apis")
            auth_module = importlib.import_module("xhs_utils.xhs_pc")
            auth = SpiderXhsProvider._create_auth(
                auth_module.XHSPcAuth,
                login_type,
                cookies,
                proxies,
            )
            return api_module.XHS_Apis(auth).bootstrap(proxies)
        except Exception as error:
            raise EnhancerConfigurationError(
                f"Unable to initialize Spider_XHS: {error}"
            ) from error

    @staticmethod
    def _create_auth(
        auth_class: Any,
        login_type: XhsLoginType,
        cookies: str,
        proxies: dict[str, str] | None,
    ) -> Any:
        if login_type is XhsLoginType.QRCODE:
            return auth_class.from_qrcode_login(
                show_in_terminal=True,
                proxies=proxies,
            )
        if login_type is XhsLoginType.PHONE:
            return auth_class.from_phone_login(proxies=proxies)
        return auth_class.from_cookie(cookies, proxies=proxies)

    @staticmethod
    def _parse_proxies(value: str) -> dict[str, str] | None:
        if not value.strip():
            return None
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as error:
            raise EnhancerConfigurationError(
                "XHS_REQUEST_PROXIES_JSON must be a JSON object"
            ) from error
        if not isinstance(parsed, dict):
            raise EnhancerConfigurationError(
                "XHS_REQUEST_PROXIES_JSON must be a JSON object"
            )
        return {str(key): str(item) for key, item in parsed.items()}

    def search_notes(
        self,
        keyword: str,
        limit: int,
        sort_by: SortBy,
        note_type: NoteType,
        include_comments: bool,
    ) -> list[CrawledNote]:
        success, message, search_items = self._api.search_some_note(
            keyword,
            limit,
            int(sort_by),
            int(note_type),
            proxies=self._proxies,
        )
        if not success:
            raise SourceError(f"XHS search failed: {message}")

        notes: list[CrawledNote] = []
        for item in search_items or []:
            if item.get("model_type") != "note":
                continue
            note = self._load_note(item, include_comments)
            if note is not None:
                notes.append(note)
        return notes

    def _load_note(
        self,
        search_item: dict[str, Any],
        include_comments: bool,
    ) -> CrawledNote | None:
        note_id = str(search_item.get("id") or "")
        if not note_id:
            return None
        note_url = self._build_note_url(note_id, search_item.get("xsec_token"))
        success, message, response = self._api.get_note_info(
            note_url,
            self._proxies,
        )
        if not success:
            raise SourceError(f"XHS note detail failed for {note_id}: {message}")
        items = ((response or {}).get("data") or {}).get("items") or []
        if not items:
            raise SourceError(f"XHS note detail is empty for {note_id}")

        note = self._normalize_note(items[0], note_url)
        if include_comments:
            note.comments = self._load_comments(note_id, note_url)
        return note

    @staticmethod
    def _build_note_url(note_id: str, xsec_token: Any) -> str:
        query = urlencode(
            {
                "xsec_token": str(xsec_token or ""),
                "xsec_source": "pc_search",
            }
        )
        return f"https://www.xiaohongshu.com/explore/{note_id}?{query}"

    def _load_comments(
        self,
        note_id: str,
        note_url: str,
    ) -> list[CrawledComment]:
        success, message, comments = self._api.get_note_all_comment(
            note_url,
            self._proxies,
        )
        if not success:
            raise SourceError(f"XHS comments failed for {note_id}: {message}")
        return self._flatten_comments(comments or [], note_id)

    def _flatten_comments(
        self,
        comments: list[dict[str, Any]],
        note_id: str,
        parent_comment_id: str | None = None,
    ) -> list[CrawledComment]:
        flattened: list[CrawledComment] = []
        for raw in comments:
            comment_id = str(raw.get("id") or "")
            if not comment_id:
                continue
            user = raw.get("user_info") or {}
            flattened.append(
                CrawledComment(
                    comment_id=comment_id,
                    note_id=note_id,
                    parent_comment_id=parent_comment_id,
                    content=str(raw.get("content") or ""),
                    author=Author(
                        user_id=str(user.get("user_id") or ""),
                        nickname=str(user.get("nickname") or ""),
                    ),
                    like_count=_as_int(raw.get("like_count")),
                    created_at=_as_timestamp(raw.get("create_time")),
                    ip_location=raw.get("ip_location"),
                )
            )
            flattened.extend(
                self._flatten_comments(
                    raw.get("sub_comments") or [],
                    note_id,
                    parent_comment_id=comment_id,
                )
            )
        return flattened

    @staticmethod
    def _normalize_note(raw: dict[str, Any], note_url: str) -> CrawledNote:
        card = raw.get("note_card") or {}
        user = card.get("user") or {}
        interact = card.get("interact_info") or {}
        tags = [
            str(tag.get("name"))
            for tag in card.get("tag_list") or []
            if tag.get("name")
        ]
        images = []
        for image in card.get("image_list") or []:
            info_list = image.get("info_list") or []
            if info_list and info_list[-1].get("url"):
                images.append(str(info_list[-1]["url"]))

        return CrawledNote(
            note_id=str(raw.get("id") or card.get("note_id") or ""),
            note_url=note_url,
            title=str(card.get("title") or ""),
            content=str(card.get("desc") or ""),
            tags=tags,
            author=Author(
                user_id=str(user.get("user_id") or ""),
                nickname=str(user.get("nickname") or ""),
            ),
            liked_count=_as_int(interact.get("liked_count")),
            collected_count=_as_int(interact.get("collected_count")),
            comment_count=_as_int(interact.get("comment_count")),
            share_count=_as_int(interact.get("share_count")),
            published_at=_as_timestamp(card.get("time")),
            ip_location=card.get("ip_location"),
            image_urls=images,
            video_url=SpiderXhsProvider._find_video_url(card),
        )

    @staticmethod
    def _find_video_url(card: dict[str, Any]) -> str | None:
        video = card.get("video") or {}
        streams = (((video.get("media") or {}).get("stream") or {}).get("h264") or [])
        if streams:
            return streams[0].get("master_url") or streams[0].get("url")
        origin_key = (video.get("consumer") or {}).get("origin_video_key")
        if origin_key:
            return f"https://sns-video-bd.xhscdn.com/{origin_key}"
        return None
