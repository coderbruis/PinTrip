# Third-party notice

The multi-agent planning structure and selected AMap integration patterns in
this service are adapted from Datawhale's `helloagents-trip-planner` example:

- Source: https://github.com/datawhalechina/hello-agents/tree/main/code/chapter13/helloagents-trip-planner
- Upstream notice: CC BY-NC-SA 4.0
- Retrieved: 2026-08-17

PinTrip changes include four independent LangChain agent modules, a separate
intent-resolution stage, direct AMap Web Service adapters, PinTrip itinerary
models, dependency injection for testing, bounded JSON repair, and explicit
failure responses.
