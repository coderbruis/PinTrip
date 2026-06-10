# OpenAPI Contracts

The Spring Boot API should export OpenAPI JSON to this folder during CI:

```text
contracts/openapi/pintrip-api.json
```

The TypeScript API client in `packages/api-client` should be generated from that contract.
