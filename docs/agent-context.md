# Agent Context and Guardrails

Domain
- Entity: User { name: string, email: string (unique) }
- Business rule: email must be unique; attempts to create duplicate should return 409

Expectations for agents
- Investigate before changing: read related code, tests, and docs
- Align with current stack: FastAPI + Express (JS) + React; TypeScript guidance is future-facing only
- Propose minimal viable change; avoid broad refactors unless required by the task
- Add or update automated tests for all behavioral changes
- Validate locally: run service, run tests relevant to the change
- Update docs when behavior or setup changes

Workflow for changes
1) Clarify scope and acceptance criteria (issue/PR template)
2) Create a focused branch (feature/*, fix/*)
3) Make incremental commits; keep changes scoped
4) Add tests and ensure they pass
5) Update docs (CLAUDE.md, docs/*, README as needed)
6) Submit PR using the template; call out risks and rollback plan

Definition of Done
- Code complete and self-reviewed
- Tests passing (Python, Node, or Frontend as applicable)
- No lint/type errors where configured
- Docs updated; ADR/architecture notes added if needed
- Security, performance, and accessibility (UI) considerations addressed

Do/Don’t
- Do follow existing patterns and structure
- Do not modify generated files, lockfiles, or built artifacts
- Do not introduce breaking API changes without coordination and migration notes
- Do not commit secrets; use environment variables
