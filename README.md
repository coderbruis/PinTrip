# PinTrip

PinTrip is an AI travel-planning product that turns Xiaohongshu notes and user preferences into editable itineraries.

## Workspace

```text
pinTrip/
  apps/
    web/                  # Customer-facing travel workspace
    admin/                # Internal operations console
    extension/            # Chrome extension for Xiaohongshu imports
  services/
    api/                  # Spring Boot API for app/admin/plugin/agent
    agents/
      import-guide-agent/          # Generate itineraries from imported notes
      natural-language-guide-agent/ # Generate itineraries from user prompts
  packages/
    shared-types/         # Shared TypeScript types not generated from OpenAPI
    api-client/           # Generated TypeScript API client
    ui/                   # Shared React UI components
  contracts/
    openapi/              # API contracts exported by the Java service
    schemas/              # Agent input/output JSON schemas
  infra/
    docker/               # Local infra and deployment helpers
  docs/
```

## Recommended Local Flow

```bash
pnpm install
pnpm dev:web
pnpm dev:admin
pnpm dev:extension

cd services/api && mvn spring-boot:run
cd services/agents/import-guide-agent && python -m uvicorn app.main:app --reload --port 8090
cd services/agents/natural-language-guide-agent && python -m uvicorn app.main:app --reload --port 8091
```

## Service Boundaries

- `apps/web`: user projects, imports, itinerary editor, map route view.
- `apps/admin`: users, import logs, task monitoring, prompt/template management.
- `apps/extension`: captures Xiaohongshu note responses in the user's logged-in Chrome session.
- `services/api`: owns auth, trips, source notes, itineraries, billing, audit, and agent task orchestration.
- `services/agents/import-guide-agent`: owns imported-note understanding, place extraction, and itinerary generation.
- `services/agents/natural-language-guide-agent`: owns user-intent understanding and prompt-based itinerary generation.
