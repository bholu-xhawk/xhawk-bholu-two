# Agent context and expectations

Domain knowledge
- Terminology
  - users: resource managed by node_api/ (Express + Mongoose)
  - hello: GET / from app/ FastAPI (app/main.py)
  - health: GET /health from api/ FastAPI (api/app.py)
- Key workflows
  - CRUD users via node_api/src/routes/users.js and node_api/src/models/User.js
  - Read health/hello endpoints for smoke tests and monitoring
- Common edge cases
  - Invalid input payloads (missing required fields, invalid formats)
  - Database connectivity failures (Mongo down or misconfigured URI)
  - Duplicate keys and not found errors

How to investigate
- Read code and tests first; entry points:
  - Frontend: frontend/src/App.jsx and pages/*
  - Node API: node_api/src/index.js → app.js → routes/ and models/
  - FastAPI: app/main.py and api/app.py; tests in tests/
- Run focused commands locally:
  - Python tests: pytest -q
  - Node tests: npm test --prefix node_api
  - Dev servers: see CLAUDE.md

Implementation guidance
- Follow layering and patterns in each area
- Prefer small, incremental changes with tests
- Keep scope tight; avoid drive‑by refactors (open a technical debt issue)
- Write tests (unit/integration) alongside code changes

Validation
- All relevant tests pass locally
- Lint/type checks pass where configured
- Manual smoke test in dev servers for impacted surfaces

Preparing PRs
- Use the PR template; include Problem, Solution, Testing, Risks, Rollback
- Link issues; attach screenshots for UI changes
- Update docs (CLAUDE.md, docs/*) when behavior or commands change

Definition of Done
- Code implemented and reviewed
- Tests added/updated and passing
- No lint/type errors (where configured)
- Documentation updated
- Frontend changes meet accessibility requirements (keyboard, focus, contrast)
