# Development standards

Clean code & SOLID
- Single Responsibility: keep modules focused (routes/controllers, services, models)
- Open/Closed: extend via new functions/modules rather than modifying deep internals
- Liskov Substitution: design interfaces (future), keep contracts consistent
- Interface Segregation: small, focused interfaces/hooks
- Dependency Inversion: inject dependencies for testability where practical

Refactoring guidelines
- Small, incremental commits with tests first when possible
- Preserve behavior; add regression tests before large changes
- Avoid combining refactors with feature changes in a single PR

Security checklist
- Never commit secrets; use environment variables and .env.example
- Keep dependencies updated; address advisories
- Validate and sanitize inputs at edges; escape/encode outputs
- Apply secure headers; configure CORS correctly; HTTPS in production
- Protect against CSRF when using cookies/sessions

Performance checklist
- Use DB indexes for frequent queries; review query plans
- Avoid N+1 with proper population/joins; project only needed fields
- Paginate list endpoints by default
- Consider caching strategy for expensive reads (future)

Accessibility checklist (frontend)
- Semantic HTML; ARIA only when necessary
- Manage focus on route/dialog transitions
- Keyboard navigable; visible focus styles
- Color contrast meets WCAG AA; support prefers-reduced-motion

Observability
- Structured logs (JSON) with request ids/correlation ids where possible
- Add hooks for metrics/tracing when infrastructure is ready
- Log at appropriate levels; avoid noisy logs and sensitive data
