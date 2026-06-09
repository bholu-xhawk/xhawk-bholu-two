# CLAUDE: Context, standards, and workflows for autonomous engineers

This repository is a small, multi-service example intended for humans and autonomous agents to practice end‑to‑end product engineering: a React frontend, two Python FastAPI services, and a Node.js Express API backed by MongoDB.

Use this document as the single source of truth for: what this product is, how it is structured, how to set up and run it locally, and the rules for contributing safely and consistently.


## Product overview

Purpose
- Demonstrate a minimal multi-service architecture with realistic development workflows.
- Provide a safe sandbox for engineering tasks, test-first changes, and agent‑friendly contributions.

Key user journeys
- Frontend can call sample endpoints to render data.
- FastAPI sample APIs respond with a hello message (/) and a health check (/health).
- Node API exposes CRUD endpoints for Users persisted to MongoDB (unique email constraint).

Core features in this repo
- FastAPI app A at app/main.py (GET / → {message: "Hello, World!"}).
- FastAPI app B at api/app.py (GET /health → {status: "ok"}).
- Node API (Express, JavaScript) with a Mongoose User model and CRUD routes.
- React frontend scaffolded with Vite.

Non-goals
- Comprehensive UI, auth, or production‑grade observability. These can be layered in later.


## Architecture

High level
- Frontend talks to backend services over HTTP.
- Node API persists data to MongoDB via Mongoose.
- FastAPI apps are stateless in this sample (no DB).

Diagram

                ┌──────────────────────────────┐
                │          Frontend            │
                │  React (Vite)                │
                │  frontend/src (App, pages)   │
                └──────────────┬───────────────┘
                               │ HTTP (fetch)
                 ┌─────────────▼─────────────┐
                 │        FastAPI            │
                 │  app.main:app ("/")       │
                 │  api.app:app ("/health")  │
                 └─────────────┬─────────────┘
                               │ (separate service)
                 ┌─────────────▼─────────────┐
                 │     Node API (Express)    │
                 │  src/app.js, routes/users │
                 │  Business logic (CRUD)    │
                 └─────────────┬─────────────┘
                               │ Mongoose
                 ┌─────────────▼─────────────┐
                 │        MongoDB            │
                 │ docker-compose service    │
                 └────────────────────────────┘


## Repository structure

- app/ — FastAPI app A (app.main:app) with root endpoint
- api/ — FastAPI app B (api.app:app) with /health
- node_api/ — Express + Mongoose API (JavaScript today)
  - src/models/User.js — Mongoose model with unique email
  - src/routes/users.js — CRUD routes and validation
  - src/app.js, src/index.js — app wiring and server
- frontend/ — React (Vite) application scaffold
- tests/ — Python tests for FastAPI services
- docker-compose.yml — local MongoDB for Node API
- README.md — quickstart (supplemental)
- docs/ — deeper engineering and architecture guides
- .github/ — PR and issue templates


## Local development

Preconditions
- Python 3.11+ and pip
- Node.js 18+ and npm
- Docker (for local MongoDB when running Node API against a real DB)

Python APIs (FastAPI)
- Install deps: pip install -r requirements.txt
- Run (app/): uvicorn app.main:app --reload
- Run (api/): uvicorn api.app:app --reload --port 8001
- Test: pytest -q or pytest tests/test_app.py tests/api/test_health.py -q

Node API (Express + Mongoose)
- Install: npm install --prefix node_api
- Dev server: npm run dev --prefix node_api
- Test: npm test --prefix node_api (uses Supertest and in-memory Mongo if configured by tests)
- Real DB: docker-compose up -d mongo; copy node_api/.env.example → node_api/.env and set MONGODB_URI

Frontend (React + Vite)
- Install: npm install --prefix frontend
- Dev server: npm run dev --prefix frontend
- Build: npm run build --prefix frontend

Linting, typing, formatting
- Expectations:
  - Frontend: use ESLint + Prettier conventions; TypeScript readiness encouraged, current code is JS.
  - Node API: JavaScript today; follow JS conventions. TypeScript guidance provided in docs/backend.md (future‑facing).
  - Python: follow PEP 8. Linters/formatters (ruff/black) may be added later; follow their norms if present.

Migrations and seed data
- Node API uses Mongoose; no migration framework included. If schemas change, write idempotent scripts and document steps in PRs.
- FastAPI apps currently have no DB; no migrations needed.


## Development workflow

Branching
- feature/<slug> for new features
- fix/<slug> for bug fixes
- chore/<slug> for maintenance, docs, infra

Commits
- Prefer Conventional Commits (feat:, fix:, chore:, docs:, test:, refactor:, perf:, build:, ci:)
- Keep commits focused and descriptive; reference issues (#123)

Pull Requests
- Use the PR template (Summary, Problem, Solution, Testing, Risks, Rollback)
- Requirements:
  - Tests added/updated and passing locally
  - Docs updated if behavior or setup changed
  - No secrets committed; avoid modifying generated or lock files unless required

Reviews & releases
- Small, focused PRs review faster. Document tradeoffs and follow standards.
- Releases are out of scope for this sample; assume independent deployments per service.


## Coding standards (summary)

General
- Favor clear, small modules and functions. Name things precisely.
- Handle errors explicitly with consistent JSON shapes from APIs.
- Log important events and errors at appropriate levels.
- Write tests for new behavior; keep coverage steady or increasing.

Python (FastAPI)
- Use Pydantic models for request/response validation.
- Return proper HTTP status codes; raise HTTPException for errors.
- Structure: routers by feature where apps grow; keep startup/shutdown minimal.
- Use pytest and TestClient for API tests.

Node (Express)
- Validate input at the edges; guard against untrusted data.
- Encapsulate Mongoose access in models/services; keep routes thin.
- Handle duplicate key (11000) and validation errors explicitly with correct status codes.
- Current code is JavaScript; TypeScript conventions are documented for future migration.

Frontend (React)
- Co-locate components, styles, and tests by feature.
- Use functional components and hooks; lift state thoughtfully.
- Provide loading, empty, and error states for async flows.
- Meet accessibility basics (labels, roles, keyboard support, color contrast).

Testing expectations
- Write unit tests for logic and components.
- Add integration/API tests for endpoints and critical flows.
- Use Testing Library for React; pytest for FastAPI; Jest + Supertest for Node.

Accessibility
- Use semantic HTML, accessible names/labels, focus management.
- Ensure color contrast and keyboard navigation.


## Agent rules and guardrails

- Start with context: read relevant code (app/, api/, node_api/, frontend/) and tests.
- Keep scope tight. Avoid cross‑cutting refactors unless the task explicitly calls for it.
- Always add or update tests for behavior changes. Never reduce coverage.
- Do not modify generated files, lockfiles, or build outputs unless required for the change; if you must, explain why.
- Avoid breaking public API contracts; if unavoidable, document migration steps in the PR.
- Update docs when behavior, setup, or dependencies change (CLAUDE.md, docs/*, README.md).
- Prefer incremental changes: commit often, keep PRs small and reviewable.


## Next steps and aspirations

- Improve CI to run language‑appropriate tests deterministically.
- Add linters/formatters and type‑checking across services.
- Consider TypeScript migration for the Node API following docs/backend.md guidance.
