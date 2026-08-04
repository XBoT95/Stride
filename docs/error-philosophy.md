# Error Handling Philosophy — Stride

> **Status:** Active / Permanent Core Policy  
> **Audience:** All human developers and AI agents

---

## 1. Executive Principles

In Stride, errors and system failures must be handled with **calm, professional, and clear user experiences**. Technical stack traces, raw database error codes, and uncaught exceptions must **never** leak to the end user.

Every failure state across the application must follow four consistent pillars:
1. **User-Facing Message**: Helpful, clear, non-technical natural language explaining what happened and how to proceed.
2. **Logging Strategy**: Structured server-side/console logging containing full diagnostic context (error message, trace, user context).
3. **Recovery Strategy**: Graceful degradation, automatic retry, or clear user recourse (e.g. retry button, safe fallback).
4. **Developer Notes**: Direct guidance on code patterns and implementation constraints for developers.

---

## 2. Failure Matrix

### 2.1 Database Failures
*Occurs when Supabase queries fail due to connection timeouts, constraint violations, or database unavailability.*

- **User-Facing Message**: *"We couldn't save your changes right now. Please try again in a moment."*
- **Logging Strategy**: Log error severity `ERROR` with SQL state, error code, target table, user ID, and operation parameters.
- **Recovery Strategy**: 
  - For reads: Show a calm error empty state with a "Retry" button.
  - For writes/mutations: Retain client input in form state; do not clear inputs.
- **Developer Notes**: Wrap database calls in `src/services/` inside `try/catch` blocks. Standardize database error parsing into domain-specific error objects (`DatabaseError`).

---

### 2.2 Authentication Failures
*Occurs during invalid credentials, expired session tokens, or unauthorized route access.*

- **User-Facing Message**:
  - Invalid credentials: *"The email or password you entered is incorrect. Please double-check and try again."*
  - Expired session: *"Your session has expired for your security. Please sign in again."*
- **Logging Strategy**: Log error severity `WARN` with auth event type, client IP hash, and timestamp. Never log plain passwords or secrets.
- **Recovery Strategy**: 
  - Next.js middleware automatically redirects unauthenticated requests to `/login?redirectTo=...`.
  - Preserve intended redirect target URL after login completion.
- **Developer Notes**: Auth state must be checked server-side via Supabase RSC clients in Next.js Server Components / Middleware.

---

### 2.3 AI Provider Failures (Gemini API)
*Occurs during rate limiting (429), API timeouts, network failure, or Zod JSON schema validation failure on model outputs.*

- **User-Facing Message**:
  - Timeout / API issue: *"Our AI execution engine is taking longer than expected. Please try generating your roadmap again."*
  - Invalid structure: *"We couldn't construct your roadmap formatting automatically. Retrying with updated guidance..."*
- **Logging Strategy**: Log error severity `ERROR` with Gemini model name, prompt tokens, raw response snippet, and Zod validation diffs.
- **Recovery Strategy**: 
  - Implement 1 automatic server-side retry with exponential backoff on transient 5xx/429 errors.
  - If schema validation fails, fallback gracefully to a standard starter template or present a clear "Retry Roadmap" button.
- **Developer Notes**: Always wrap Gemini API calls using Zod `safeParse`. Never parse raw LLM strings with unvalidated `JSON.parse`.

---

### 2.4 Network & Connectivity Failures
*Occurs when the user loses internet connectivity or network requests fail in-flight.*

- **User-Facing Message**: *"You appear to be offline. Please check your internet connection and try again."*
- **Logging Strategy**: Log client-side warning (`WARN`) in browser console. No server log generated if unreachable.
- **Recovery Strategy**: 
  - Display a subtle top toast/banner indicating offline state.
  - Pause auto-submits until connectivity is restored.
- **Developer Notes**: Use native browser `navigator.onLine` and fetch error detection in client components.

---

### 2.5 Input & Validation Failures
*Occurs when user submits form inputs that fail Zod validation rules (e.g. empty goal title, past target date).*

- **User-Facing Message**: Contextual inline field messages (e.g. *"Goal title must be at least 3 characters long"*).
- **Logging Strategy**: Log client/server debug logs (`INFO`) for field validation failures.
- **Recovery Strategy**: 
  - Keep form data intact.
  - Highlight specific invalid input fields and move focus to the first error.
- **Developer Notes**: Validate form payloads using Zod schemas on both client forms and Server Actions.

---

### 2.6 Unknown / Unhandled Errors
*Occurs during unexpected runtime exceptions (e.g. null pointer, undefined access).*

- **User-Facing Message**: *"An unexpected error occurred while loading this page. Our team has been notified."*
- **Logging Strategy**: Log severity `FATAL` with full stack trace, request path, timestamp, and environment metadata.
- **Recovery Strategy**: 
  - Caught by Next.js `error.tsx` boundary.
  - Render a calm, full-page or component error boundary UI with a "Reload Page" or "Return to Dashboard" action.
- **Developer Notes**: Ensure every app sub-segment (`app/(dashboard)/error.tsx`) has a dedicated error boundary component.

---

## 3. Implementation Rules for Developers

1. **Never Throw Raw Errors to UI Components**: `src/services/` methods must return explicit `{ data, error }` tuple signatures or typed domain exceptions.
2. **Sanitize Log Messages**: Ensure sensitive user information (passwords, tokens, PII) is stripped prior to logging.
3. **Calm UI Aesthetics**: Error indicators must fit Stride's dark, calm aesthetic — avoid flashing red banners, disruptive modal popups, or hostile technical jargon.
