# Stride — Product Specification & Status

> **Status:** v0.1 Implemented Baseline  
> **Codename:** Stride  
> **Audience:** Product Managers, Architects, AI Agents

---

## 1. Product Overview

Stride is an AI-powered Execution Partner designed to help individuals achieve ambitious goals by transforming high-level objectives into structured, sequential execution roadmaps and daily action plans.

Unlike traditional productivity tools that require manual planning and organization, Stride focuses on **execution**:
1. User provides a high-level goal title and description.
2. AI Execution Engine (Gemini 3.6 Flash) generates a structured roadmap with sequential milestones and 5–15 minute beginner-friendly action tasks.
3. Stride schedules Milestone 1 tasks for today's execution while keeping future milestones queued.
4. As users complete milestone tasks, Stride automatically advances the roadmap and surfaces the next milestone's tasks.

---

## 2. Product Vision

Build an AI Chief of Staff that acts as an proactive execution partner.

Instead of requiring users to organize and re-prioritize work manually, Stride understands their goals, breaks them down into actionable steps, adapts when progress is made, and maintains execution momentum until goals are finished.

---

## 3. Problem Statement

People rarely fail because they lack ambition.

They fail because:
- High-level goals feel overwhelming.
- Tasks are too vague or complex to start immediately.
- Existing tools organize work but do not guide daily execution.
- Tracking progress across multiple goals becomes cluttered and discouraging.

---

## 4. Target Users (v0.1 Focus)

- Solo founders & builders
- Indie developers & engineers
- University students & researchers
- Freelancers & creative professionals

---

## 5. Core Product Principles

1. **Execution over organization**: Focus on taking action today rather than organizing backlogs.
2. **Beginner-friendly task breakdown**: AI generates clear 5–15 minute single-action tasks.
3. **Calm, uncluttered interface**: Dark high-contrast presentation inspired by Linear and Vercel.
4. **Milestone progression pacing**: Surface today's active tasks without flooding the user with future milestone steps.
5. **Zero-bloat architecture**: Build minimal, high-performance features using native Server Components and Server Actions.

---

## 6. Version Feature Matrix

### v0.1 Implemented Functionality (Current Baseline)
- **User Authentication**: Login, Signup, Session refresh via Supabase Auth & Next.js middleware.
- **Goal Creation**: High-level goal intake (title, description, target date, priority).
- **AI Roadmap Engine**: Structured JSON roadmap generation using Gemini 3.6 Flash (`@google/genai`) and Zod schema validation.
- **Atomic Persistence**: Stored procedure `public.create_goal_with_roadmap` for transactional Goal, Milestone, and Task persistence.
- **Today's Focus Dashboard**: Grouped daily task rendering by Goal with completion metrics.
- **Deterministic Two-Level Task Sorting**: Tasks sorted by `(milestone.sequence_order ASC, task.sequence_order ASC)`.
- **Automatic Milestone Progression**: Stored procedure `public.toggle_task_and_advance_milestone` automatically schedules Milestone N+1 tasks when Milestone N is 100% completed.
- **Goal Detail & Roadmap Tree**: Hierarchical roadmap tree rendering milestones and nested tasks.
- **Delete Goal Danger Zone**: Accessible 2-step confirmation modal for permanent cascading goal deletion.

### v0.2 Deferred Functionality
- **Subtask Decomposition**: Breaking tasks into micro-steps.
- **AI Reflections & Weekly Reviews**: Proactive reflection loops.
- **Calendar & Time-blocking Integration**: Syncing tasks to external calendars.
- **Team Workspaces & Collaboration**: Shared multi-user goal dashboards.
- **Notifications & Reminders**: Email and push reminders.
- **Mobile Applications**: Native iOS/Android apps.

---

## 7. Tech Stack

- **Framework**: Next.js `16.3.0` (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS `v4`, Lucide React icons, `clsx`, `tailwind-merge`
- **Database & Auth**: Supabase PostgreSQL, `@supabase/ssr` `0.5.2`
- **AI Engine**: Google Gemini API (`@google/genai` `2.17.1`, model `gemini-3.6-flash`)
- **Validation**: Zod `4.4.3`
- **Package Manager**: `pnpm`

---

## 8. Current Development Status

- **Status**: **v0.1 Implemented & Verified Baseline**
- **Build Status**: Passing `tsc --noEmit`, `eslint`, and `next build` clean.
