# PinTrip Natural-language Guide Service

This service turns a free-form travel request into the PinTrip itinerary schema.
It uses four small LangChain agents for intent resolution, AMap-backed attraction
and weather research, and final itinerary planning. LangGraph owns workflow state,
parallel research fan-out/join, validation routing, and bounded retries.

Agent directories:

- `app/agents/intent`: converts natural language into structured trip intent.
- `app/agents/attraction`: searches AMap places and summarizes candidates.
- `app/agents/weather`: queries AMap weather and summarizes travel risks.
- `app/agents/itinerary`: combines the research into PinTrip's itinerary schema.

The deployable service lives under `services/agent-apps`; its internal Agent
roles live under `app/agents`, and LangGraph orchestration lives under
`app/workflows/natural_language_guide`:

- `state.py`: shared graph state.
- `nodes.py`: node behavior and retry routing.
- `graph.py`: graph nodes, edges, parallel join, and compiled workflow.
- `dependencies.py`: the four Agent interfaces injected into the graph.

## Setup

```bash
python -m venv .venv
.venv/bin/pip install -e .
cp .env.example .env
.venv/bin/python -m uvicorn app.main:app --reload --port 8091
```

Required configuration:

- `LLM_API_KEY` (or `OPENAI_API_KEY`) and an OpenAI-compatible model endpoint.
- `AMAP_MAPS_API_KEY` for AMap Web Service API calls.

## API

```http
POST /agent/natural-language-guide/generate
Content-Type: application/json

{
  "trip_id": "trip-123",
  "prompt": "国庆去成都玩三天，公共交通，喜欢美食和人文，不要太累",
  "start_date": "2026-10-01"
}
```

The response keeps PinTrip's `title`, `summary`, `sourceNoteIds`, `days`,
`budgetSummary`, and `riskTips` contract. The service returns `503` when required
credentials are missing and `502` when the Agent workflow cannot produce valid
structured output.

## Runtime progress

The console logs request and LangGraph node progress with `trip_id` and
`duration_ms`. Attraction and weather logs start together because those nodes run
in parallel. Requests that include `destination`, `days`, and `preferences` use
the structured intent fast path and avoid an extra LLM call. Prompts and API keys
are never written to these progress logs.

See [NOTICE.md](NOTICE.md) for the adapted upstream example and license notice.
