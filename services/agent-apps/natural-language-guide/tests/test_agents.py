import unittest

from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.agents.attraction import AttractionAgent
from app.agents.intent import IntentAgent
from app.agents.itinerary import ItineraryAgent
from app.agents.weather import WeatherAgent


class FakeAmapClient:
    def search_places(
        self, city: str, keywords: str, limit: int = 20
    ) -> list[dict]:
        return [
            {
                "name": "武侯祠",
                "address": "武侯祠大街231号",
                "photos": ["https://example.com/wuhouci.jpg"],
            }
        ]

    def get_weather(self, city: str) -> list[dict]:
        return [{"date": "2026-10-01", "dayweather": "晴"}]


class LangChainAgentsTest(unittest.TestCase):
    def test_intent_agent_uses_langchain_model(self) -> None:
        agent = IntentAgent(FakeListChatModel(responses=['{"destination":"成都"}']))

        self.assertEqual(agent.resolve("去成都玩"), '{"destination":"成都"}')

    def test_attraction_agent_returns_amap_data_without_llm(self) -> None:
        agent = AttractionAgent(FakeAmapClient())

        result = agent.research("成都", ["人文"], 2, "成都两日人文游")

        self.assertIn('"source": "amap"', result)
        self.assertIn("武侯祠", result)
        self.assertIn("https://example.com/wuhouci.jpg", result)

    def test_weather_agent_returns_amap_data_without_llm(self) -> None:
        agent = WeatherAgent(FakeAmapClient())

        result = agent.research("成都", None)

        self.assertIn('"source": "amap"', result)
        self.assertIn('"dayweather": "晴"', result)

    def test_itinerary_agent_uses_langchain_model(self) -> None:
        agent = ItineraryAgent(FakeListChatModel(responses=["{}"]))

        self.assertEqual(agent.generate("生成行程"), "{}")


if __name__ == "__main__":
    unittest.main()
