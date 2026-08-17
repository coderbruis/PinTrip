import json
import unittest

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
        workflow = self.build_workflow(FakeItineraryAgent(itinerary_response()))

        result = workflow.plan(
            NaturalLanguageGuideRequest(
                trip_id="trip-1",
                prompt="成都两日低强度美食旅行",
            )
        )

        self.assertEqual(result.trip_id, "trip-1")
        self.assertEqual(len(result.days), 2)
        self.assertEqual(result.days[0].items[0].place, "地点1")
        self.assertEqual(result.source_note_ids, [])
        self.assertIn("sourceNoteIds", result.model_dump(by_alias=True))
        self.assertIn("budgetSummary", result.model_dump(by_alias=True))

    def test_skips_intent_llm_when_structured_fields_are_complete(self) -> None:
        intent_agent = FakeIntentAgent()
        workflow = self.build_workflow(
            FakeItineraryAgent(itinerary_response(days=1)), intent_agent
        )

        with self.assertLogs(
            "uvicorn.error.pintrip.workflow", level="INFO"
        ) as logs:
            result = workflow.plan(
                NaturalLanguageGuideRequest(
                    trip_id="trip-fast-path",
                    prompt="成都一日低强度人文旅行",
                    destination="成都",
                    days=1,
                    transportation="公共交通",
                    preferences=["人文", "低强度"],
                )
            )

        self.assertEqual(len(result.days), 1)
        self.assertEqual(intent_agent.queries, [])
        self.assertTrue(
            any("intent.fast_path" in message for message in logs.output)
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
