# Architecture

System overview
- Frontend (React/Vite) communicates over HTTP to multiple backend services
- Backends are independent: two FastAPI apps and one Express app
- Node API persists data to MongoDB via Mongoose; FastAPI apps are stateless in this sample

Service boundaries
- Frontend → FastAPI root app: GET "/" (sample)
- Frontend → FastAPI health app: GET "/health" (sample)
- Frontend → Node API: CRUD /users (business data)

Data flow (request/response)

Frontend ──HTTP──> FastAPI (app.main) ──returns──> { message: "Hello, World!" }
Frontend ──HTTP──> FastAPI (api.app) ──returns──> { status: "ok" }
Frontend ──HTTP──> Express API ──Mongoose──> MongoDB ──returns──> JSON resources

Node → Mongo detail
- Express route validates input
- Mongoose model enforces schema (required, unique email)
- On duplicate email, Mongo error code 11000 → 409 response

Authentication
- Current state: no auth
- Future guidance: adopt JWT-based auth or session cookies with CSRF protection. Add middleware and guards, store user identities securely, and propagate request identity in logs.

Deployment architecture
- Local: run services independently; use docker-compose up -d mongo for Mongo
- Production: deploy services separately with explicit versioning; isolate environments for frontend, FastAPI(s), and Node API; managed MongoDB service

External dependencies
- MongoDB (Docker for local)
- npm and Node for frontend and Node API
- Python and pip for FastAPI

Events/background jobs
- None today. If introduced, use a separate worker and durable queue. Document schema for events and maintain backward compatibility.
