# Project guide for coding agents (CLAUDE.md)

Purpose
- This repository demonstrates a simple full‑stack layout for learning/bootstrapping patterns:
  - Frontend portfolio app built with Vite + React Router + Framer Motion
  - Minimal Python FastAPI surfaces (hello and health)
  - Node.js Express API backed by MongoDB (Mongoose) with Jest tests
- Goal: provide a clear backbone for agents and contributors to iterate safely and predictably.

Key user journeys
- Browse frontend pages and navigate via React Router
- Call FastAPI hello endpoint (GET / at app/main.py)
- Check FastAPI health endpoint (GET /health at api/app.py)
- CRUD users through Node API (node_api/, /users routes)

High‑level architecture
- Monorepo with independent surfaces:
  - frontend/: Vite + React (JS today)
  - app/: FastAPI app exposing GET /
  - api/: FastAPI app exposing GET /health (service health probe)
  - node_api/: Express + Mongoose (MongoDB) with users CRUD
  - docker-compose.yml: local Mongo service

Development commands
- Python/FastAPI
  - Create venv: python -m venv .venv && source .venv/bin/activate
  - Install deps: pip install -r requirements.txt
  - Run hello app: uvicorn app.main:app --reload
  - Run health app: python -m api.app  (or: uvicorn api.app:app --reload --port 8001)
  - Run tests: pytest -q
- Node API (Express + Mongoose)
  - Install deps: npm install --prefix node_api
  - Run dev/start: npm start --prefix node_api
  - Run tests: npm test --prefix node_api (uses in‑memory Mongo, no Docker required)
- Frontend (Vite React)
  - Install deps: npm install --prefix frontend
  - Dev server: npm run dev --prefix frontend (default http://localhost:5173)
  - Build: npm run build --prefix frontend
  - Preview: npm run preview --prefix frontend
- Lint/Type check (optional, if configured in future)
  - Python: ruff or flake8
  - JS: eslint/prettier
  - TS: tsc --noEmit for type checks (when TypeScript introduced)
- Database migrations/seed (Node API)
  - Pattern: create scripts under node_api/scripts/ for seeding/migrations
  - Example script outline (conceptual):
    - node_api/scripts/seed.js connects via MONGODB_URI, inserts fixtures, exits

Repository structure
- app/: FastAPI hello service (GET /)
- api/: FastAPI health service (GET /health)
- node_api/: Express + Mongoose API with users resource and tests
- frontend/: Vite + React app (pages/components)
- tests/: Python tests for FastAPI apps
- docker-compose.yml: local Mongo service

Development workflow
- Branching: trunk‑based with short‑lived feature branches
- Commits: Conventional Commits recommended (feat:, fix:, docs:, refactor:, test:, chore:, ci:)
- Pull requests:
  - Keep scope tight; link issues
  - Add/update tests for any behavior change
  - Update docs when commands or behavior change
  - Fill out PR template (Problem, Solution, Testing, Risks, Rollback)
- Reviews: small PRs preferred; maintainers focus on correctness, tests, and docs
- Releases: tag versions and maintain a changelog when applicable

Coding standards (current defaults)
- Naming & file organization
  - JS: PascalCase filenames for React components (e.g., Navbar.jsx); PascalCase for component names
  - Python: snake_case for modules, functions, and variables; PascalCase for classes
- Error handling
  - Node: centralized error middleware and structured error objects
  - Python: raise HTTPException for API errors; use pydantic validation when added
- Logging
  - Node: pino (recommended when added) or console with structured shape today
  - Python: standard logging module; keep messages structured
- Testing expectations
  - Add tests for new logic and endpoints (unit/integration)
  - Target ~80% line coverage for new code where practical
- Accessibility (frontend)
  - Use semantic HTML, manage focus, ensure keyboard navigation, and meet contrast ratios

Agent guidelines
- Never modify generated or vendored files
- Always add tests with behavior changes
- Follow existing patterns and layering in each area
- Keep scope tight; avoid drive‑by refactors (open a technical debt issue instead)
- Update docs (this file and relevant area guides) whenever behavior or commands change

Preconditions for local setup
- Python 3.11+
- Node.js LTS
- MongoDB optional locally; use Docker: docker-compose up -d mongo

Service boundaries (clarity)
- app/ (FastAPI): demo hello surface at GET /
- api/ (FastAPI): independent health check at GET /health
- node_api/: CRUD users and future business endpoints
- frontend/: consumes APIs via HTTP; currently static/demo content
