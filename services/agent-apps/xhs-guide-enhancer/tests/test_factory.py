import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.config import EnhancerConfigurationError
from app.factory import get_enhancement_service


class EnhancementFactoryTest(unittest.TestCase):
    def tearDown(self) -> None:
        get_enhancement_service.cache_clear()

    def test_converts_model_initialization_failure_to_configuration_error(self):
        settings = SimpleNamespace(
            require_credentials=lambda: None,
            llm_model_id="test-model",
            resolved_llm_api_key="test-key",
            llm_base_url=None,
            llm_timeout=10,
            llm_max_retries=0,
        )
        get_enhancement_service.cache_clear()

        with (
            patch("app.factory.get_settings", return_value=settings),
            patch(
                "app.factory.ChatOpenAI",
                side_effect=ImportError("missing optional dependency"),
            ),
            self.assertRaisesRegex(
                EnhancerConfigurationError,
                "Unable to initialize enhancement model client",
            ),
        ):
            get_enhancement_service()


if __name__ == "__main__":
    unittest.main()
