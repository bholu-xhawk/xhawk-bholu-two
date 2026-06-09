# Frontend Engineering Guide

Stack
- React (Vite), React Router (if/when routing is needed), CSS via standard Vite setup. TypeScript is encouraged for new modules but current code is JavaScript. Use TS-like patterns with JSDoc types where helpful.

Required skills
- Component architecture, composition, and hooks
- Accessibility (WCAG), semantics, keyboard and screen reader support
- Responsive design and performance (code-splitting, memoization)
- Testing with Testing Library and Vitest/Jest

Conventions
- Structure: frontend/src/{components,pages,hooks,utils}
- Components: one component per file; co-locate styles and tests
- Hooks: prefix use*, keep pure and reusable
- State: prefer local state and React Query/ SWR patterns for server data (if introduced)
- API calls: centralize fetch wrappers; handle errors, loading, and empty states
- Forms: controlled inputs, validation at input and submit
- Error boundaries: wrap async routes and critical trees
- UX: skeletons/spinners for loading, meaningful empty states, clear error messaging

UI standards
- Use a simple design system: spacing scale (4px multiples), typography tokens, and color tokens. Respect contrast ratios.
- Interactive elements must be focusable, have visible focus, and be operable via keyboard

Testing
- Targets: components (unit), pages (integration), and API hooks (integration)
- Expectations: maintain or increase coverage; test critical paths and edge cases
- Prefer Testing Library; avoid brittle snapshot tests; test behavior not implementation
