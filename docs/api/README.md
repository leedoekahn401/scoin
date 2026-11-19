Snapshot of the API's OpenAPI spec. Live: `http://localhost:4000/docs` (UI) and `/docs-json`.
Every endpoint is under `/api/v1` (B7). `pnpm api:generate` refreshes
`packages/api-client/openapi.json` and `src/schema.d.ts`; copy the JSON here when tagging a release.

Endpoints that are specified but not built yet answer `501 { "error": { "code": "NOT_IMPLEMENTED" } }`
and name the requirement in the message.
