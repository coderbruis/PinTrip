# Architecture

PinTrip uses a Java API service as the system of record, TypeScript apps for web surfaces, a Chrome extension for user-side imports, and two independent Agent services for long-running generation work.

## Request Flow

```text
Chrome extension -> services/api /api/plugin/xhs/import-callback
apps/web         -> services/api /api/app/*
apps/admin       -> services/api /api/admin/*
services/api     -> import job -> services/agents/import-guide-agent
services/api     -> prompt job -> services/agents/natural-language-guide-agent
services/agents/* -> services/api callback
```

## API Namespaces

- `/api/app/*`: customer-facing web API.
- `/api/admin/*`: admin console API.
- `/api/plugin/*`: Chrome extension callbacks.
- `/api/agent/*`: agent task callbacks and internal APIs.

## Data Ownership

The Java API owns persisted data. Each Agent service receives one kind of explicit task and returns structured outputs. The import guide Agent processes captured notes, while the natural-language guide Agent processes user prompts. The Chrome extension never uploads cookies, headers, or tokens; it only posts captured note content.
