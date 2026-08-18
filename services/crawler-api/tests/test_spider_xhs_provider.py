import unittest
from pathlib import Path
from unittest.mock import Mock

from app.config import CrawlerConfigurationError, Settings, XhsLoginType
from app.providers.spider_xhs import SpiderXhsProvider


class SpiderXhsProviderTest(unittest.TestCase):
    def test_defaults_to_bundled_submodule(self):
        settings = Settings(_env_file=None)

        self.assertEqual(
            Path(__file__).resolve().parents[1] / "vendor" / "Spider_XHS",
            settings.spider_xhs_path,
        )

    def test_cookie_login_requires_cookie(self):
        settings = Settings(
            _env_file=None,
            xhs_login_type="cookie",
            xhs_cookies="",
        )

        with self.assertRaisesRegex(CrawlerConfigurationError, "XHS_COOKIES"):
            settings.require_spider_xhs()

    def test_interactive_login_does_not_require_cookie(self):
        for login_type in ("qrcode", "phone"):
            with self.subTest(login_type=login_type):
                settings = Settings(
                    _env_file=None,
                    xhs_login_type=login_type,
                    xhs_cookies="",
                )

                settings.require_spider_xhs()
                self.assertTrue(settings.is_ready)

    def test_dispatches_supported_login_types(self):
        auth_class = Mock()
        auth_class.from_cookie.return_value = "cookie-auth"
        auth_class.from_qrcode_login.return_value = "qrcode-auth"
        auth_class.from_phone_login.return_value = "phone-auth"
        proxies = {"https": "http://proxy.test"}

        cookie_auth = SpiderXhsProvider._create_auth(
            auth_class,
            XhsLoginType.COOKIE,
            "a1=test; web_session=test",
            proxies,
        )
        qrcode_auth = SpiderXhsProvider._create_auth(
            auth_class,
            XhsLoginType.QRCODE,
            "",
            proxies,
        )
        phone_auth = SpiderXhsProvider._create_auth(
            auth_class,
            XhsLoginType.PHONE,
            "",
            proxies,
        )

        self.assertEqual("cookie-auth", cookie_auth)
        self.assertEqual("qrcode-auth", qrcode_auth)
        self.assertEqual("phone-auth", phone_auth)
        auth_class.from_cookie.assert_called_once_with(
            "a1=test; web_session=test",
            proxies=proxies,
        )
        auth_class.from_qrcode_login.assert_called_once_with(
            show_in_terminal=True,
            proxies=proxies,
        )
        auth_class.from_phone_login.assert_called_once_with(proxies=proxies)

    def test_flattens_first_and_second_level_comments(self):
        provider = object.__new__(SpiderXhsProvider)
        comments = provider._flatten_comments(
            [
                {
                    "id": "root-1",
                    "content": "一级评论",
                    "user_info": {"user_id": "u1", "nickname": "甲"},
                    "sub_comments": [
                        {
                            "id": "child-1",
                            "content": "二级评论",
                            "user_info": {"user_id": "u2", "nickname": "乙"},
                        }
                    ],
                }
            ],
            "note-1",
        )

        self.assertEqual(2, len(comments))
        self.assertIsNone(comments[0].parent_comment_id)
        self.assertEqual("root-1", comments[1].parent_comment_id)


if __name__ == "__main__":
    unittest.main()
