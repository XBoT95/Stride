# Engineering Principles — Stride

> **Status:** Active / Permanent Core Policy  
> **Audience:** All human contributors and AI agents

---

## 1. Core Engineering Philosophy

Stride is an **AI Execution Partner**, designed to be simple, calm, fast, and maintainable over years. Every line of code written to this repository must follow these core principles.

### 1.1 Simplicity Over Cleverness
- Write readable, explicit code rather than terse or "clever" one-liners.
- If code requires extensive explanation to understand, it should be rewritten to be self-explanatory.
- Avoid premature abstractions, hyper-generic helpers, and unnecessary design patterns.

### 1.2 Build Systems, Not Hacks
- Solve underlying problems at their root cause. Avoid temporary workarounds, monkey-patches, or silent fallbacks.
- Build reusable, well-scoped domain services rather than writing ad-hoc logic inside UI components.

### 1.3 Performance is a Feature
- Pages must load fast and respond instantly.
- Leverage Next.js Server Components (RSC) to minimize client-side JavaScript bundle sizes.
- Optimize database queries with appropriate indexes and avoid N+1 query patterns.

### 1.4 Accessibility is Mandatory
- Every interactive element must be keyboard navigable, accessible via screen readers, and maintain proper ARIA attributes.
- High contrast, focus rings, and legible typography must be enforced across all UI themes.

### 1.5 Small, Meaningful Commits
- Keep changes atomic, focused, and scoped to a single logical task.
- Every commit must leave the application in a building, fully functional state.

### 1.6 Single Responsibility Principle (SRP)
- Every file, component, service, and function must have exactly one clear reason to change.
- Limit file lengths to **~300–400 lines max**. When a module grows beyond this, refactor it into smaller, composed modules.

### 1.7 Loose Coupling Between Modules
- Domain modules (Auth, Goals, AI, Tasks) must operate independently.
- Auth does not depend on AI; AI does not depend on Task execution logic.
- Cross-domain interactions must happen through explicit service interfaces.

### 1.8 Prefer Deleting Code Over Adding Unnecessary Code
- Dead code, unused utility functions, and orphaned components must be deleted immediately.
- Removing lines of code decreases surfaces for bugs and maintenance overhead.

### 1.9 Minimize Dependencies
- Before adding any NPM package, ask: *"Can this be cleanly implemented using the standard platform or existing stack?"*
- Avoid external state managers, micro-utilities, and single-function packages.

### 1.10 AI Reduces Friction, Not Increases Complexity
- AI must function as an invisible assistant that eliminates cognitive load.
- AI must return structured, deterministic JSON payloads validated by Zod schemas.

### 1.11 Feature Justification
- Every feature must solve a proven execution problem. If a feature does not help the user complete their active goals, it does not belong in the product.

### 1.12 Clear Next Action UX
- Every screen in Stride must communicate a clear, unambiguous primary action for the user. Never leave the user wondering what to do next.

### 1.13 Maintain Codebase Consistency
- Follow unified naming conventions, file directory patterns, and component structures across the entire project.

### 1.14 Long-Term Maintainability Over Short-Term Speed
- Write code assuming it will be maintained for the next five years. Never sacrifice code quality or architecture to save a few minutes.

---

## 2. Official Engineering Rules

### Rule I: The 10-Minute Rule
> **If a problem or bug cannot be understood within 10 minutes, stop writing code immediately.**

- Halt code mutation and read the full error stack traces, logs, and upstream context.
- Investigate the root cause until the mechanism of failure is clear.
- **Never patch a bug that is not fully understood.**

### Rule II: The Rewrite Rule
> **If implementing a feature feels unusually difficult or convoluted, question the architecture before questioning your code.**

- Good architecture makes implementation straightforward and obvious.
- If code requires complex workarounds or state juggling, stop and refactor the underlying design instead of forcing complex logic into a poor foundation.

### Rule III: The Delete Rule
> **The best code is the code that doesn't exist.**

- Before adding new functions, classes, or state, evaluate whether simplifying or removing existing logic resolves the issue.
- Code should only exist if it provides clear, measurable user or system value.
