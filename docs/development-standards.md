# Development Standards

Clean code principles
- Small, focused functions and modules; descriptive names
- Prefer composition over inheritance; dependency injection where helpful
- Avoid side effects; write pure functions where possible

SOLID (adapted)
- SRP: one reason to change per module
- OCP: extend without modifying existing behavior when feasible
- LSP: respect function contracts; keep substitutions safe
- ISP: keep interfaces small; segregate responsibilities
- DIP: depend on abstractions, not concretions (services around models/routes)

Refactoring guidelines
- Cover with tests first; change in small steps; keep behavior stable
- Delete dead code; simplify conditionals; remove duplication

Security checklist
- Validate and sanitize all inputs
- Never log secrets or sensitive PII
- Use HTTPS in production and secure headers (helmet for Express, appropriate middleware for FastAPI)
- Principle of least privilege for DB and service accounts

Performance checklist
- Avoid N+1 queries; index frequently queried fields (e.g., email)
- Cache where appropriate with clear invalidation rules
- Measure with profiling tools before optimizing

Accessibility (frontend)
- Semantic HTML, labels, roles, focus management
- Color contrast and keyboard operability

Observability
- Logging: request/response and error logs with correlation IDs when available
- Metrics: basic RED (rate, errors, duration) for services when infra exists
- Tracing: add OpenTelemetry when introducing distributed tracing
