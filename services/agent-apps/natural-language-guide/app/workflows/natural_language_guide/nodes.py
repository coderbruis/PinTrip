import json
from typing import Literal

from pydantic import ValidationError

from ...models import GeneratedItinerary, ResolvedTripIntent
from ...observability import log_workflow_node, logger
from .dependencies import WorkflowAgents
from .intent_parser import parse_simple_trip_intent
from .parsing import parse_model
from .state import GuideWorkflowState

DEFAULT_TRIP_DAYS = 3


class WorkflowError(RuntimeError):
    """Raised when the Agent workflow cannot produce a valid itinerary."""


class GuideWorkflowNodes:
    def __init__(self, agents: WorkflowAgents, max_generation_attempts: int):
        self._agents = agents
        self._max_generation_attempts = max_generation_attempts

    @log_workflow_node("resolve_intent")
    def resolve_intent(self, state: GuideWorkflowState) -> GuideWorkflowState:
        request = state["request"]
        if request.destination:
            logger.info(
                "intent.fast_path trip_id=%s reason=destination_provided",
                request.trip_id,
            )
            return {
                "intent": ResolvedTripIntent(
                    destination=request.destination,
                    days=request.days or DEFAULT_TRIP_DAYS,
                    transportation=request.transportation or "公共交通",
                    accommodation=request.accommodation or "舒适型酒店",
                    preferences=request.preferences,
                )
            }

        parsed_intent = parse_simple_trip_intent(request.prompt)
        if parsed_intent is not None:
            logger.info(
                "intent.fast_path trip_id=%s reason=simple_prompt",
                request.trip_id,
            )
            return {"intent": parsed_intent}

        query = f"""请解析以下旅行需求，并按Schema返回JSON。

用户描述：{request.prompt}
已提供目的地：{request.destination or '未提供'}
已提供天数：{request.days or '未提供'}
交通偏好：{request.transportation or '未提供'}
住宿偏好：{request.accommodation or '未提供'}
偏好标签：{', '.join(request.preferences) or '未提供'}

Schema：
{json.dumps(ResolvedTripIntent.model_json_schema(), ensure_ascii=False)}
"""
        try:
            intent = parse_model(self._agents.intent.resolve(query), ResolvedTripIntent)
        except (ValueError, ValidationError) as error:
            raise WorkflowError(f"Unable to resolve trip intent: {error}") from error
        return {"intent": intent}

    @log_workflow_node("research_attractions")
    def research_attractions(
        self, state: GuideWorkflowState
    ) -> GuideWorkflowState:
        request = state["request"]
        intent = state["intent"]
        result = self._agents.attraction.research(
            destination=intent.destination,
            keywords=intent.preferences[:3],
            days=intent.days,
            prompt=request.prompt,
        )
        return {"attraction_research": result}

    @log_workflow_node("research_weather")
    def research_weather(self, state: GuideWorkflowState) -> GuideWorkflowState:
        request = state["request"]
        intent = state["intent"]
        result = self._agents.weather.research(
            intent.destination, request.start_date
        )
        return {"weather_research": result}

    @log_workflow_node("generate_itinerary")
    def generate_itinerary(self, state: GuideWorkflowState) -> GuideWorkflowState:
        query = state.get("itinerary_query") or self._build_itinerary_query(state)
        response = self._agents.itinerary.generate(query)
        attempts = state.get("generation_attempts", 0) + 1

        try:
            itinerary = parse_model(response, GeneratedItinerary)
            expected_days = state["intent"].days
            if len(itinerary.days) != expected_days:
                raise ValueError(
                    f"expected {expected_days} days, received {len(itinerary.days)}"
                )
            return {
                "itinerary": itinerary,
                "itinerary_query": query,
                "itinerary_response": response,
                "generation_attempts": attempts,
                "generation_error": None,
            }
        except (ValueError, ValidationError) as error:
            return {
                "itinerary_query": self._build_repair_query(query, response, error),
                "itinerary_response": response,
                "generation_attempts": attempts,
                "generation_error": str(error),
            }

    def route_after_generation(
        self, state: GuideWorkflowState
    ) -> Literal["complete", "retry", "failed"]:
        if state.get("itinerary") is not None:
            logger.info(
                "generation.route result=complete attempts=%d",
                state.get("generation_attempts", 0),
            )
            return "complete"
        if state.get("generation_attempts", 0) < self._max_generation_attempts:
            logger.info(
                "generation.route result=retry attempts=%d max_attempts=%d",
                state.get("generation_attempts", 0),
                self._max_generation_attempts,
            )
            return "retry"
        logger.info(
            "generation.route result=failed attempts=%d max_attempts=%d",
            state.get("generation_attempts", 0),
            self._max_generation_attempts,
        )
        return "failed"

    @staticmethod
    def fail_generation(state: GuideWorkflowState) -> GuideWorkflowState:
        raise WorkflowError(
            "Unable to generate a valid itinerary: "
            f"{state.get('generation_error', 'unknown validation error')}"
        )

    @staticmethod
    def _build_itinerary_query(state: GuideWorkflowState) -> str:
        request = state["request"]
        intent = state["intent"]
        return f"""请生成旅行攻略。

用户原始描述：{request.prompt}
解析后的需求：{intent.model_dump_json()}
开始日期：{request.start_date or '未指定'}

景点研究结果：
{state['attraction_research']}

天气研究结果：
{state['weather_research']}

输出Schema：
{json.dumps(GeneratedItinerary.model_json_schema(), ensure_ascii=False)}
"""

    @staticmethod
    def _build_repair_query(query: str, response: str, error: Exception) -> str:
        return f"""{query}

上一次输出未通过校验：{error}
请修正后重新输出完整JSON。上一次输出如下：
{response[:4000]}
"""
