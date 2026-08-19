# PinTrip Natural-language Guide Service

This service turns a free-form travel request into the PinTrip itinerary schema.
It uses LLM agents for complex intent resolution and final itinerary planning,
plus lightweight AMap-backed attraction and weather research. LangGraph owns
workflow state, parallel research fan-out/join, validation routing, and bounded
retries.

Agent directories:

- `app/agents/intent`: converts natural language into structured trip intent.
- `app/agents/attraction`: searches and normalizes AMap places without an LLM call.
- `app/agents/weather`: queries and normalizes AMap forecasts without an LLM call.
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

The web search box sends its text as `prompt`. Unambiguous single-destination
prompts such as `成都两天美食游` use a local fast path. Complex and multi-city
prompts fall back to the Intent Agent.

## User-guide retrieval

The workflow has a dedicated `retrieve_user_guides` node. It runs in parallel
with attraction and weather research, then passes structured historical-guide
evidence to the itinerary Agent. Retrieval is split into three boundaries:

- `UserGuideRetriever`: builds the deterministic query, hydrates canonical
  chunks, and preserves vector ranking.
- `GuideVectorStore`: searches within a mandatory user scope.
- `GuideRepository`: rechecks access while loading canonical chunk content.

When `RAG_DATABASE_URL` is configured, the factory injects the PostgreSQL +
pgvector adapter. Without it, the service uses `NullUserGuideRetriever` and keeps
the existing generation behavior. The optional generation request `user_id`
must come from an authenticated server-side gateway; never trust a
browser-supplied owner identifier for access control.

Start the development database from the repository root:

```bash
docker compose -f infra/rag/compose.yml up -d
```

Configure the service:

```dotenv
RAG_DATABASE_URL=postgresql://pintrip:pintrip@127.0.0.1:5433/pintrip
EMBEDDING_MODEL_ID=text-embedding-3-small
EMBEDDING_API_KEY=your-embedding-api-key
EMBEDDING_DIMENSIONS=1536
```

The adapter lazily creates the `vector` extension, canonical
`pintrip_user_guides` table, `pintrip_guide_chunks` table, user/destination
index, and cosine HNSW index. Index a completed guide with:

```http
POST /agent/natural-language-guide/knowledge/guides
Content-Type: application/json

{
  "user_id": "user-1",
  "guide_id": "guide-1",
  "destination": "成都",
  "revision": 1,
  "guide": {
    "title": "成都两日游",
    "summary": "低强度美食路线",
    "days": [{
      "day": 1,
      "title": "老城漫步",
      "items": [{
        "time": "09:00",
        "place": "宽窄巷子",
        "activity": "散步并品尝小吃"
      }]
    }],
    "budgetSummary": "人均 800 元",
    "riskTips": ["提前确认开放时间"]
  }
}
```

Then pass the same authenticated `user_id` to the generate endpoint. Retrieval
uses the resolved destination, embeds the semantic query, filters within that
user before similarity ordering, and hydrates authorized canonical chunks.

Run the real pgvector integration test against the development database:

```bash
TEST_RAG_DATABASE_URL=postgresql://pintrip:pintrip@127.0.0.1:5433/pintrip \
  .venv/bin/python -m unittest tests.test_postgres_retrieval -v
```

## Runtime progress

The console logs request and LangGraph node progress with `trip_id` and
`duration_ms`. Attraction and weather logs start together because those nodes run
in parallel through the async graph. They no longer make intermediate LLM calls;
their normalized AMap results are consumed by the final itinerary Agent. Requests
that include `destination`, and simple prompts recognized locally, avoid an extra
intent LLM call. When `days` is omitted, the workflow defaults to a three-day
itinerary. Prompts and API keys are never written to these progress logs.

See [NOTICE.md](NOTICE.md) for the adapted upstream example and license notice.
