# Architecture Decision Record (ADR) — Stride

> **Status:** Approved / Active  
> **Audience:** All human contributors, software architects, and AI agents

---

## ADR-001: Next.js 16.3.0 (App Router) as Canonical Core Framework

### Context
Stride requires a fast, SEO-friendly, server-rendered application with strong TypeScript support, built-in routing, and minimal client JS bundle size. Initial project setup established Next.js 16.3.0 as the active environment.

### Decision
Use **Next.js 16.3.0 (App Router)** as the canonical application framework inside the `/app` directory.

- **No Downgrades**: Next.js 16.3.0 is established as the canonical baseline version and will not be downgraded.
- **Major Version Pinning**: Do not upgrade Next.js major versions without explicit review and approval.
- **Documentation Alignment**: For all implementation work, developers and AI agents must consult local/installed Next.js 16.x documentation prior to adopting framework APIs.

### Trade-offs & Rationale
- **Pros**: Native Server Components (RSC) eliminate heavy client bundle bloat; Turbopack bundler support; built-in Server Actions replace complex API boilerplates; instant Vercel deployment.
- **Cons**: App Router caching mental model can be non-trivial; server/client boundary separation requires strict discipline.

---

## ADR-002: Strict TypeScript Across Entire Codebase

### Context
Stride's execution engine relies on deterministic data contracts between database tables, domain services, AI output schemas, and UI components.

### Decision
Enforce **TypeScript in strict mode** across all source files (`tsconfig.json` with `strict: true`).

### Trade-offs & Rationale
- **Pros**: Catches type errors at build time; auto-completes Supabase DB schema types; ensures deterministic Gemini AI response parsing via Zod.
- **Cons**: Minor overhead when defining initial types and DTO interfaces.

---

## ADR-003: Supabase (PostgreSQL + Auth) for Backend & Database

### Context
Stride requires a reliable, relational database with robust authentication, Row Level Security (RLS), and simple developer experience for v0.1 without running custom server infrastructure.

### Decision
Use **Supabase (PostgreSQL)** for database and user authentication.

### Trade-offs & Rationale
- **Pros**: Standard PostgreSQL relational database with zero ORM lock-in; built-in auth solution; native RLS for user data isolation; auto-generated TypeScript database types.
- **Cons**: Direct reliance on Supabase ecosystem features (mitigated by wrapping Supabase client access strictly inside `src/services/`).

---

## ADR-004: Google Gemini API (`@google/genai`) for AI Execution Engine

### Context
The core MVP functionality requires parsing unstructured user goal descriptions into structured, multi-stage execution roadmaps with milestones and actionable tasks.

### Decision
Use **Google Gemini API (`@google/genai`)** with Zod schema validation for structured JSON generation.

### Current Implementation Amendment (2026-08-26)
The active implementation uses **Gemini 3.6 Flash** (`gemini-3.6-flash`) via `@google/genai` v2.17.1 with structured `responseSchema` and `RoadmapSchema` Zod validation, delivering fast, beginner-friendly structured execution roadmaps.

### Trade-offs & Rationale
- **Pros**: High-speed output generation, native structured JSON enforcement, cost-effective API tier (`gemini-3.6-flash`).
- **Cons**: External API dependency requires rate limiting, timeout handling, and fallback logic (governed by `docs/error-philosophy.md`).

---

## ADR-005: React Server Components (RSC) as Default Rendering Model

### Context
Client-side hydration overhead creates slow initial page loads and unnecessary JavaScript bloat in productivity apps.

### Decision
Default to **React Server Components (RSC)** for all pages and components. Use Client Components (`"use client"`) only when interactive browser state (form inputs, toggle buttons, dialogs) is strictly required.

### Trade-offs & Rationale
- **Pros**: Zero client JS for server-rendered UI; direct secure access to backend services and environment variables.
- **Cons**: Cannot use browser hooks (`useState`, `useEffect`) directly inside Server Components.

---

## ADR-006: Server Actions Replacing React Query & Client State Managers for MVP

### Context
Adding state management libraries like TanStack Query (React Query) or Zustand introduces extra client bundle size, cache invalidation sync issues, and boilerplate code.

### Decision
Use **Next.js native Server Actions** combined with `revalidatePath` for data mutations and state updates in v0.1.

### Trade-offs & Rationale
- **Pros**: Eliminates ~50KB+ of client JS dependencies; simplifies data mutations into pure async functions; native integration with RSC revalidation.
- **Cons**: Optimistic UI updates require native React hooks (`useOptimistic`) rather than React Query cache manipulation.

---

## ADR-007: Dedicated `src/services/` Business Logic Layer

### Context
Embedding SQL queries, Supabase calls, and Gemini API logic directly inside Next.js page files or UI components creates monolithic, untestable code.

### Decision
All business logic, database queries, and AI prompt processing must live inside **`src/services/`** (`auth.service.ts`, `goal.service.ts`, `roadmap.service.ts`, `task.service.ts`).

### Trade-offs & Rationale
- **Pros**: Clear separation of concerns; components remain pure presentation layers; services are 100% testable in node environments; easy migration if DB or AI vendors change.
- **Cons**: Adds a thin service abstraction layer between UI and database.

---

## ADR-008: Postponing AI Reflections, Team Workspaces, and Collaboration to v0.2+

### Context
Adding multi-user team workspaces, real-time collaboration, and complex AI reflection loops in v0.1 expands MVP scope significantly, delaying launch and obscuring core execution testing.

### Decision
Postpone team workspaces, collaboration, notifications, focus timers, and AI reflections to **Version 0.2+**. Focus v0.1 Beta strictly on the single-user linear path: `Login -> Create Goal -> AI Roadmap -> Today's Tasks -> Complete -> Progress`.

### Trade-offs & Rationale
- **Pros**: Reduces initial codebase complexity by 60%; allows perfecting single-user goal execution before multi-tenant complexity.
- **Cons**: Multi-user team workflows are not testable until v0.2.

---

## ADR-009: Intentionally Small, Focused MVP Scope

### Context
Productivity tools often suffer from feature bloat, attempting to be all-in-one solutions (calendars, documents, chat, whiteboards) rather than excelling at one core problem.

### Decision
Keep Stride v0.1 Beta **intentionally minimal**. Every feature must directly serve the user's daily goal execution.

### Trade-offs & Rationale
- **Pros**: Lightning-fast load times, clear user mental model, rapid development cycle, high maintainability.
- **Cons**: Users seeking complex all-in-one project management suites will find v0.1 intentionally constrained.
