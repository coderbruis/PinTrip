import json
import asyncio
import threading
import unittest

from app.agents.weather import WeatherAgent
from app.infrastructure.amap_client import AmapClientError
from app.models import NaturalLanguageGuideRequest
from app.workflows import NaturalLanguageGuideWorkflow, WorkflowAgents, WorkflowError


class FakeIntentAgent:
    def __init__(self, *responses: str):
        self.responses = list(responses)
        self.queries: list[str] = []

    def resolve(self, query: str) -> str:
        self.queries.append(query)
        if not self.responses:
            raise AssertionError("FakeAgent has no response configured")
        return self.responses.pop(0)


class FakeAttractionAgent:
    def __init__(self, response: str):
        self.response = response
        self.calls: list[dict] = []

    def research(
        self, destination: str, keywords: list[str], days: int, prompt: str
    ) -> str:
        self.calls.append(
            {
                "destination": destination,
                "keywords": keywords,
                "days": days,
                "prompt": prompt,
            }
        )
        return self.response


class FakeWeatherAgent:
    def __init__(self, response: str):
        self.response = response

    def research(self, destination: str, start_date) -> str:
        return self.response


class FailingWeatherAmapClient:
    def get_weather(self, city: str) -> list[dict]:
        raise AmapClientError(f"cannot resolve city adcode: {city}")


class FakeItineraryAgent:
    def __init__(self, *responses: str):
        self.responses = list(responses)
        self.queries: list[str] = []

    def generate(self, query: str) -> str:
        self.queries.append(query)
        if not self.responses:
            raise AssertionError("FakeItineraryAgent has no response configured")
        return self.responses.pop(0)


def intent_response(days: int = 2) -> str:
    return json.dumps(
        {
            "destination": "成都",
            "days": days,
            "transportation": "公共交通",
            "accommodation": "经济型酒店",
            "preferences": ["美食", "人文"],
            "requirements": ["低强度"],
        },
        ensure_ascii=False,
    )


def itinerary_response(days: int = 2) -> str:
    return json.dumps(
        {
            "title": "成都两日旅行攻略",
            "summary": "公共交通低强度行程",
            "sourceNoteIds": [],
            "days": [
                {
                    "day": day,
                    "title": f"第{day}天",
                    "imageUrl": f"https://example.com/day-{day}.jpg",
                    "items": [
                        {
                            "time": "09:00",
                            "place": f"地点{day}",
                            "activity": "游览",
                            "transport": "地铁",
                            "tips": [],
                        }
                    ],
                }
                for day in range(1, days + 1)
            ],
            "budgetSummary": "人均1000元",
            "riskTips": ["出发前确认开放时间"],
        },
        ensure_ascii=False,
    )


class NaturalLanguageGuideWorkflowTest(unittest.TestCase):
    def build_workflow(
        self,
        itinerary_agent: FakeItineraryAgent,
        intent_agent: FakeIntentAgent | None = None,
    ) -> NaturalLanguageGuideWorkflow:
        return NaturalLanguageGuideWorkflow(
            WorkflowAgents(
                intent=intent_agent or FakeIntentAgent(intent_response()),
                attraction=FakeAttractionAgent("景点研究结果"),
                weather=FakeWeatherAgent("天气研究结果"),
                itinerary=itinerary_agent,
            )
        )

    def test_generates_pintrip_itinerary(self) -> None:
        intent_agent = FakeIntentAgent(intent_response())
        workflow = self.build_workflow(
            FakeItineraryAgent(itinerary_response()), intent_agent
        )

        result = workflow.plan(
            NaturalLanguageGuideRequest(
                trip_id="trip-1",
                prompt="国庆想找一个适合美食和人文的国内城市，安排两天低强度旅行",
            )
        )

        self.assertEqual(result.trip_id, "trip-1")
        self.assertEqual(len(result.days), 2)
        self.assertEqual(result.days[0].items[0].place, "地点1")
        self.assertEqual(
            result.days[0].image_url, "https://example.com/day-1.jpg"
        )
        self.assertEqual(result.source_note_ids, [])
        self.assertEqual(len(intent_agent.queries), 1)
        response_payload = result.model_dump(by_alias=True)
        self.assertIn("sourceNoteIds", response_payload)
        self.assertIn("budgetSummary", response_payload)
        self.assertEqual(
            response_payload["days"][0]["imageUrl"],
            "https://example.com/day-1.jpg",
        )

    def test_skips_intent_llm_when_destination_is_provided(self) -> None:
        intent_agent = FakeIntentAgent()
        workflow = self.build_workflow(
            FakeItineraryAgent(itinerary_response(days=3)), intent_agent
        )

        with self.assertLogs(
            "uvicorn.error.pintrip.workflow", level="INFO"
        ) as logs:
            result = workflow.plan(
                NaturalLanguageGuideRequest(
                    trip_id="trip-fast-path",
                    prompt="成都",
                    destination="成都",
                )
            )

        self.assertEqual(len(result.days), 3)
        self.assertEqual(intent_agent.queries, [])
        self.assertTrue(
            any("intent.fast_path" in message for message in logs.output)
        )

    def test_async_plan_runs_research_branches_concurrently(self) -> None:
        barrier = threading.Barrier(2)

        class ParallelAttractionAgent(FakeAttractionAgent):
            def research(self, destination, keywords, days, prompt):
                barrier.wait(timeout=1)
                return super().research(destination, keywords, days, prompt)

        class ParallelWeatherAgent(FakeWeatherAgent):
            def research(self, destination, start_date):
                barrier.wait(timeout=1)
                return super().research(destination, start_date)

        workflow = NaturalLanguageGuideWorkflow(
            WorkflowAgents(
                intent=FakeIntentAgent(),
                attraction=ParallelAttractionAgent("景点研究结果"),
                weather=ParallelWeatherAgent("天气研究结果"),
                itinerary=FakeItineraryAgent(itinerary_response()),
            )
        )

        result = asyncio.run(
            workflow.aplan(
                NaturalLanguageGuideRequest(
                    trip_id="trip-parallel",
                    prompt="成都",
                    destination="成都",
                    days=2,
                )
            )
        )

        self.assertEqual(2, len(result.days))

    def test_weather_failure_does_not_block_itinerary_generation(self) -> None:
        itinerary_agent = FakeItineraryAgent(itinerary_response())
        workflow = NaturalLanguageGuideWorkflow(
            WorkflowAgents(
                intent=FakeIntentAgent(),
                attraction=FakeAttractionAgent("景点研究结果"),
                weather=WeatherAgent(FailingWeatherAmapClient()),
                itinerary=itinerary_agent,
            )
        )

        result = workflow.plan(
            NaturalLanguageGuideRequest(
                trip_id="trip-weather-unavailable",
                prompt="未知景区玩两天",
                destination="未知景区",
                days=2,
            )
        )

        self.assertEqual(2, len(result.days))
        self.assertIn('"available": false', itinerary_agent.queries[0])

    def test_fills_missing_day_images_from_amap_research(self) -> None:
        response = json.loads(itinerary_response())
        response["days"][0].pop("imageUrl")
        response["days"][1].pop("imageUrl")
        attraction_research = json.dumps(
            {
                "source": "amap",
                "places": [
                    {
                        "name": "地点1",
                        "photos": ["https://example.com/amap-place-1.jpg"],
                    },
                    {
                        "name": "地点2",
                        "photos": ["https://example.com/amap-place-2.jpg"],
                    },
                ],
            },
            ensure_ascii=False,
        )
        workflow = NaturalLanguageGuideWorkflow(
            WorkflowAgents(
                intent=FakeIntentAgent(intent_response()),
                attraction=FakeAttractionAgent(attraction_research),
                weather=FakeWeatherAgent("天气研究结果"),
                itinerary=FakeItineraryAgent(json.dumps(response, ensure_ascii=False)),
            )
        )

        result = workflow.plan(
            NaturalLanguageGuideRequest(trip_id="trip-images", prompt="成都两日游")
        )

        self.assertEqual(
            "https://example.com/amap-place-1.jpg", result.days[0].image_url
        )
        self.assertEqual(
            "https://example.com/amap-place-2.jpg", result.days[1].image_url
        )

    def test_builds_expected_langgraph(self) -> None:
        workflow = self.build_workflow(FakeItineraryAgent(itinerary_response()))

        graph = workflow.graph.get_graph()
        nodes = set(graph.nodes)
        edges = {(edge.source, edge.target) for edge in graph.edges}

        self.assertIn("resolve_intent", nodes)
        self.assertIn("research_attractions", nodes)
        self.assertIn("research_weather", nodes)
        self.assertIn("generate_itinerary", nodes)
        self.assertIn(("resolve_intent", "research_attractions"), edges)
        self.assertIn(("resolve_intent", "research_weather"), edges)
        self.assertIn(("research_attractions", "generate_itinerary"), edges)
        self.assertIn(("research_weather", "generate_itinerary"), edges)
        self.assertIn(("generate_itinerary", "generate_itinerary"), edges)

    def test_retries_invalid_planner_output(self) -> None:
        itinerary_agent = FakeItineraryAgent("not json", itinerary_response())
        workflow = self.build_workflow(itinerary_agent)

        result = workflow.plan(
            NaturalLanguageGuideRequest(trip_id="trip-2", prompt="成都两日游")
        )

        self.assertEqual(len(result.days), 2)
        self.assertEqual(len(itinerary_agent.queries), 2)
        self.assertIn("上一次输出未通过校验", itinerary_agent.queries[1])

    def test_raises_when_output_never_becomes_valid(self) -> None:
        workflow = self.build_workflow(
            FakeItineraryAgent("invalid", "still invalid")
        )

        with self.assertRaises(WorkflowError):
            workflow.plan(
                NaturalLanguageGuideRequest(trip_id="trip-3", prompt="成都两日游")
            )


if __name__ == "__main__":
    unittest.main()
