# Backend guide

Technology stack
- Node.js + Express + Mongoose (JavaScript today)
- FastAPI (Python) for small microservices and health checks
- Future TypeScript guidelines
  - Define DTOs and request/response types; validate with Zod/Joi/celebrate when added

Required skills
- REST API design (resourceful routes, status codes)
- Authentication basics (JWT/session) — not implemented yet
- MongoDB modeling with Mongoose (schemas, indexes, validation)
- Performance and scalability basics
- Background jobs (future: queues/workers)
- Testing with Jest + Supertest (Node) and pytest + httpx (FastAPI)

Standards
- API design
  - Resourceful routes (e.g., /users), use nouns; support pagination, filtering, sorting via query params
  - Consistent status codes and error shapes; include error code and message
- Request validation
  - Add celebrate/Joi or Zod when ready; validate at the edge (router layer)
- Error handling
  - Central error middleware in Express; map known errors to 4xx; unexpected to 500 with correlation id
  - FastAPI: use pydantic models and raise HTTPException with detail payloads
- Logging
  - Node: pino recommended (JSON logs, levelled); today console.log with structured objects is acceptable
  - Python: logging module with structured messages
- Monitoring and metrics (future)
  - Add hooks for tracing/metrics when infrastructure is available
- Security
  - Follow OWASP ASVS; set security headers (helmet), enable CORS appropriately, sanitize inputs
  - Do not log secrets or PII; rotate keys; keep dependencies updated

Database standards (MongoDB)
- Migration/change management via scripts (node_api/scripts/)
- Schema conventions: timestamps, indexes for frequent queries, unique constraints where required
- Query performance: avoid N+1 patterns; project only required fields; paginate
- Transactions: use Mongo sessions where multi‑document atomicity is required

Testing standards
- Node
  - Unit tests for services/utils; integration tests with Supertest for HTTP routes
  - Use in‑memory Mongo for isolation in tests (already configured)
- FastAPI
  - pytest with TestClient; include positive and negative cases

Dev commands
- npm install --prefix node_api
- npm start --prefix node_api
- npm test --prefix node_api
- Mongo: docker-compose up -d mongo
