# Stride

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-3.6_Flash-orange?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Stride** is an AI-powered goal execution platform that transforms ambitious personal and professional objectives into structured, sequential milestones and daily action tasks.

---

## Overview

Most productivity tools focus on **organization**—building backlogs, categorizing tags, and arranging Kanban columns. Stride focuses on **execution**.

When you input a goal into Stride, the AI Execution Engine (powered by **Google Gemini 3.6 Flash**) breaks it down into chronologically ordered milestones and 5–15 minute beginner-friendly action steps. Stride surfaces today's focus tasks on your dashboard, tracks completion, and automatically schedules the next milestone's tasks as you complete your active goals.

---

## Core Capabilities (v0.1 Baseline)

- **AI Roadmap Generation**: Converts goal descriptions into 3–6 sequential milestones with 2–5 actionable tasks per milestone using structured JSON (`@google/genai`) and Zod schema validation.
- **Beginner-Friendly Task Pacing**: Tasks are generated as 5–15 minute executable steps with plain step-by-step instructions.
- **Atomic Database Persistence**: Goal, milestone, and task hierarchies are saved transactionally via PostgreSQL stored procedure `public.create_goal_with_roadmap`.
- **Today's Focus Dashboard**: Surfaces active tasks scheduled for today, grouped by parent goal with progress metrics.
- **Deterministic Two-Level Task Sorting**: Tasks maintain a 100% stable position sorted by `(milestone.sequence_order ASC, task.sequence_order ASC)`. Completion status never alters task positions.
- **Automatic Milestone Progression**: Completing 100% of tasks in Milestone N invokes PostgreSQL procedure `public.toggle_task_and_advance_milestone` to automatically schedule Milestone N+1 tasks for `CURRENT_DATE`.
- **Goal Detail & Roadmap Tree**: Visualizes the full sequential execution tree for any goal.
- **Danger Zone Cascading Deletion**: Accessible 2-step confirmation dialog allowing users to permanently delete a goal, automatically purging associated milestones and tasks via PostgreSQL `ON DELETE CASCADE` and Row Level Security (`(select auth.uid()) = user_id`).

---

## Technology Stack

- **Framework**: Next.js `16.3.0` (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS `v4`, Lucide React icons
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & `@supabase/ssr`
- **AI SDK**: `@google/genai` `2.17.1` (Gemini 3.6 Flash)
- **Validation**: Zod `4.4.3`
- **Package Manager**: `pnpm`

---

## High-Level Architecture

```text
Presentation Layer (RSC Pages & Client Components)
        │
        ▼
Server Actions Layer (createGoalAction, toggleTaskAction, deleteGoalAction)
        │
        ▼
Domain Service Layer (GoalService, TaskService, RoadmapService, AuthService)
        │
        ├──► AI Engine (Google Gemini 3.6 Flash via @google/genai)
        │
        ▼
Database Layer (Supabase PostgreSQL stored procedures & RLS policies)
```

---

## Getting Started

### Prerequisites

- Node.js `v20+`
- `pnpm` (`npm i -g pnpm`)
- Supabase Project URL & Anon Key
- Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/XBoT95/Stride.git
   cd Stride
   ```

2. **Install dependencies**:
   ```bash
   cd app
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create `app/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Apply Database Schemas & Migrations**:
   Run the SQL scripts located in `database/schemas/00_all_schemas.sql` and `database/migrations/` in your Supabase SQL Editor.

5. **Run Development Server**:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Documentation Sitemap

Detailed documentation is available in the [`/docs`](/docs) directory:

- [**System Architecture**](docs/system-architecture.md) — Comprehensive technical architecture specification.
- [**Database Schema**](docs/database_schema.md) — Baseline entity specifications, composite FKs, RLS policies, and RPC definitions.
- [**Engineering Principles**](docs/engineering-principles.md) — Zero-bloat rule, code style, and security guidelines.
- [**Architecture Decision Records (ADRs)**](docs/architecture-decisions.md) — Historical ADR logs and implementation amendments.
- [**Error Philosophy**](docs/error-philosophy.md) — Normalized error boundaries and fallback rules.
- [**Project Specification**](docs/project.md) — Product vision, v0.1 implemented scope, and v0.2 roadmap.
- [**Changelog**](CHANGELOG.md) — Verified reverse-chronological development history.
- [**AI Agent Guidelines**](AGENTS.md) — Developer and AI agent rules for working on Stride.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
