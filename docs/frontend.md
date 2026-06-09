# Frontend guide

Stack
- React 18, Vite, React Router, Framer Motion
- JavaScript today; plan for progressive TS adoption

TypeScript migration path
- For JS files now, enable // @ts-check at top and use JSDoc for types where helpful
- New modules may use .ts/.tsx when TypeScript is introduced; run tsc --noEmit in CI when configured

Required skills
- Component architecture and composition, hooks (useState/useEffect/useMemo/useCallback)
- Performance basics (memoization, rendering costs, dependency arrays)
- Accessibility (WCAG), keyboard navigation, focus management
- Responsive design with CSS, prefers-reduced-motion
- Testing with React Testing Library + Vitest/Jest

Project layout (frontend/src)
- components/: reusable UI components
- pages/: route‑level pages
- hooks/: custom hooks (if introduced)
- styles/: CSS modules or global styles (index.css present)
- app wiring: main.jsx, App.jsx, router definitions

Conventions
- Component files: PascalCase (e.g., Navbar.jsx), one component per file when practical
- Hooks: use‑prefix naming (useFetch, useToggle)
- State management
  - Prefer local state; elevate to context only when multiple branches share state
  - Avoid unnecessary global stores; introduce Redux/Zustand only if justified
- API consumption
  - Use a small fetch/axios wrapper for base URL, JSON parsing, and error mapping
  - Always handle loading, error, and empty states
  - Consider abort controllers for in‑flight request cancellation on unmount
- Forms
  - Use controlled inputs; basic validation client‑side; server errors surfaced inline
- Routing
  - Route‑level code splits optional; use React Router for nested routes
- Errors and boundaries
  - Use an error boundary for top‑level crashes; show a friendly fallback
- Motion
  - Use Framer Motion sparingly; respect prefers‑reduced‑motion

UI standards
- When a design system is introduced, follow tokens for spacing, typography, and color
- Today: keep spacing consistent (8px scale), accessible color contrast, and semantic structure
- Focus management on route changes and modal dialogs; ensure keyboard navigation paths

Testing
- Use React Testing Library for DOM queries by role/label/text
- Favor behavior over implementation details
- Targets for new code: ~80% lines; cover critical logic and edge cases
- Example patterns
  - Render a page, assert on headings and links
  - Mock fetch/axios responses for components that load data
  - Verify loading and error states render appropriately

Dev commands
- npm install --prefix frontend
- npm run dev|build|preview --prefix frontend
