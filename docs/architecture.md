# Architecture

PinTrip uses a Java API service as the system of record, TypeScript apps for web surfaces, a Chrome extension for user-side imports, and an independent Agent service for long-running generation work.

## Request Flow

```text
Chrome extension -> services/api /api/plugin/xhs/import-callback
apps/web         -> services/api /api/app/*
apps/admin       -> services/api /api/admin/*
services/api     -> queue/job -> services/agent
services/agent   -> services/api or database callback
```

## API Namespaces

- `/api/app/*`: customer-facing web API.
- `/api/admin/*`: admin console API.
- `/api/plugin/*`: Chrome extension callbacks.
- `/api/agent/*`: agent task callbacks and internal APIs.

## Data Ownership

The Java API owns persisted data. The Agent service receives explicit tasks and returns structured outputs. The Chrome extension never uploads cookies, headers, or tokens; it only posts captured note content.
