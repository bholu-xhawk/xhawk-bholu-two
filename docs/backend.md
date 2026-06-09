# Backend Engineering Guide

Two backends are present today.

FastAPI (Python)
- Layout: app/main.py and api/app.py export FastAPI instances
- Endpoints: GET / (hello), GET /health (status ok)
- Testing: pytest with fastapi.testclient
- Logging: use Python logging; include request IDs if middleware is added later
- Errors: prefer HTTPException with meaningful detail; return JSON with stable shape
- Validation: use Pydantic models for request bodies and responses as the app evolves

Express (Node.js, JavaScript today)
- Layout: node_api/src/app.js wires middleware and routes; src/routes/users.js defines CRUD; src/models/User.js defines a Mongoose model with unique email
- Config: environment variables via node_api/.env (copy from .env.example for real DB)
- Testing: Jest + Supertest (npm test --prefix node_api). Tests can use in-memory Mongo
- Errors: map Mongo duplicate key (11000) to 409, validation to 400, not found to 404, and unexpected to 500
- Logging: use a structured logger when added; include request correlation IDs when present

TypeScript (future guidance, not active yet)
- Folder structure: src/ with .ts files; tsconfig.json; build to dist/
- Typings: define Request/Response DTOs and Mongoose model interfaces; avoid any
- Tooling: ESLint with typescript-eslint; ts-jest or ts-node for tests/dev
- Migration approach: migrate module-by-module; add types where they add safety

API design standards
- Consistent resource naming and versioning (e.g., /api/v1/users when formalized)
- Validate inputs at edges; reject invalid data with clear error messages
- Pagination, filtering, sorting for list endpoints when necessary
- Use appropriate status codes; include machine-readable error codes

Security
- Never trust input; sanitize and validate
- Do not log secrets or PII
- Enable CORS explicitly
- AuthN/Z: no auth in sample; future: JWT or session with CSRF for browser clients

Observability
- Log request start/stop, status codes, and errors
- Surface basic metrics (request rate, error rate, latency) when infra exists

Database (Mongo via Mongoose)
- Schema conventions: required fields, indexes for lookup and uniqueness
- Migrations: no framework provided; write scripts for breaking changes and document
- Transactions: use session-based transactions if multi-document consistency is required (Mongo replica set)

Testing standards
- Unit tests for business logic
- Integration tests for routes and model interactions
- API contract tests for public endpoints
