from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from ...models import NaturalLanguageGuideRequest, NaturalLanguageGuideResponse
from .dependencies import WorkflowAgents
from .nodes import GuideWorkflowNodes, WorkflowError
from .state import GuideWorkflowState


def build_guide_graph(nodes: GuideWorkflowNodes) -> CompiledStateGraph:
    graph = StateGraph(GuideWorkflowState)
    graph.add_node("resolve_intent", nodes.resolve_intent)
    graph.add_node("research_attractions", nodes.research_attractions)
    graph.add_node("research_weather", nodes.research_weather)
    graph.add_node("generate_itinerary", nodes.generate_itinerary)
    graph.add_node("fail_generation", nodes.fail_generation)

    graph.add_edge(START, "resolve_intent")
    graph.add_edge("resolve_intent", "research_attractions")
    graph.add_edge("resolve_intent", "research_weather")
    graph.add_edge(
        ["research_attractions", "research_weather"], "generate_itinerary"
    )
    graph.add_conditional_edges(
        "generate_itinerary",
        nodes.route_after_generation,
        {
            "complete": END,
            "retry": "generate_itinerary",
            "failed": "fail_generation",
        },
    )
    graph.add_edge("fail_generation", END)
    return graph.compile(name="natural-language-guide")


class NaturalLanguageGuideWorkflow:
    def __init__(self, agents: WorkflowAgents, max_generation_attempts: int = 2):
        if max_generation_attempts < 1:
            raise ValueError("max_generation_attempts must be at least 1")
        self._graph = build_guide_graph(
            GuideWorkflowNodes(agents, max_generation_attempts)
        )

    @property
    def graph(self) -> CompiledStateGraph:
        return self._graph

    def plan(
        self, request: NaturalLanguageGuideRequest
    ) -> NaturalLanguageGuideResponse:
        try:
            state = self._graph.invoke(
                {"request": request, "generation_attempts": 0}
            )
            return self._build_response(request, state)
        except WorkflowError:
            raise
        except Exception as error:
            raise WorkflowError(f"Agent workflow failed: {error}") from error

    async def aplan(
        self, request: NaturalLanguageGuideRequest
    ) -> NaturalLanguageGuideResponse:
        """Run independent research branches concurrently without blocking FastAPI."""
        try:
            state = await self._graph.ainvoke(
                {"request": request, "generation_attempts": 0}
            )
            return self._build_response(request, state)
        except WorkflowError:
            raise
        except Exception as error:
            raise WorkflowError(f"Agent workflow failed: {error}") from error

    @staticmethod
    def _build_response(
        request: NaturalLanguageGuideRequest,
        state: GuideWorkflowState,
    ) -> NaturalLanguageGuideResponse:
        itinerary = state.get("itinerary")
        if itinerary is None:
            raise WorkflowError("Agent workflow completed without an itinerary")
        return NaturalLanguageGuideResponse(
            trip_id=request.trip_id,
            original_prompt=request.prompt,
            **itinerary.model_dump(),
        )


__all__ = ["NaturalLanguageGuideWorkflow", "WorkflowAgents", "WorkflowError"]
