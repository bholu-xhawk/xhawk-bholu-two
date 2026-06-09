# Architecture overview

System architecture
- Monorepo with distinct services:
  - frontend/: Vite React app (client)
  - app/: FastAPI (hello surface)
  - api/: FastAPI (health surface)
  - node_api/: Express + Mongoose (users CRUD)
  - MongoDB via Docker for local development

Service boundaries
- app/ (FastAPI): public sample endpoint GET /
- api/ (FastAPI): internal/ops health endpoint GET /health
- node_api/: owns user data and CRUD; does not depend on FastAPI services
- frontend/: displays pages, can consume Node API (and FastAPI demo endpoints) via HTTP

Data/request flow (local)
- Frontend → HTTP → FastAPI (hello) or Node API (users)
- Node API → MongoDB (Docker) for persistence
- FastAPI services are stateless and have no DB today

Authentication
- None implemented. When adding auth, choose one:
  - JWT (access + refresh), short‑lived tokens, rotate/blacklist as needed
  - Session cookies with server‑side store and CSRF protections
- Document chosen approach in this file and update clients/servers consistently

Deployment
- Local development
  - Run uvicorn for FastAPI, node for Express, and Vite dev server for frontend
  - Mongo via docker-compose up -d mongo
- Containerization (future)
  - Each service can be containerized independently; Mongo remains a separate container/service

Future extensions
- Background jobs and queues (e.g., BullMQ, Celery) for async work
- Event flows (webhooks or pub/sub) when needed
