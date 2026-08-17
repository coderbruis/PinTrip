# Architecture

PinTrip uses a Java API service as the system of record, TypeScript apps for web surfaces, a Chrome extension for user-side imports, and two independent Agent services for long-running generation work.

## Request Flow

```text
Chrome extension -> services/api /api/plugin/xhs/import-callback
apps/web         -> services/api /api/app/*
apps/admin       -> services/api /api/admin/*
services/api       -> import job -> services/agent-apps/import-guide
services/api       -> prompt job -> services/agent-apps/natural-language-guide
services/agent-apps/* -> services/api callback
```

## API Namespaces

- `/api/app/*`: customer-facing web API.
- `/api/admin/*`: admin console API.
- `/api/plugin/*`: Chrome extension callbacks.
- `/api/agent/*`: agent task callbacks and internal APIs.

## Data Ownership

The Java API owns persisted data. Each Agent service receives one kind of explicit task and returns structured outputs. The import guide Agent processes captured notes, while the natural-language guide Agent processes user prompts. The Chrome extension never uploads cookies, headers, or tokens; it only posts captured note content.

## Natural-language Guide Workflow

```text
prompt -> intent Agent --+-> attraction Agent --+
                         +-> weather Agent -----+-> itinerary Agent -> validate
                                                    ^                 |
                                                    +------ retry ----+
```

LangGraph owns the shared workflow state and graph edges. Attraction and weather
research fan out after intent resolution and join before itinerary generation.
The itinerary Agent only consumes the user request and research results; a
conditional edge retries invalid output once before returning an explicit error.
