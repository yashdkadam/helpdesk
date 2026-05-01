# Helpdesk - AI-Powered Ticket Management System

## Project Overview

A ticket management system that uses AI to classify, respond to, and route support tickets. See `project-scope.md` for full requirements and `implementation-plan.md` for phased task breakdown.

## Tech Stack

- **Frontend**: React + TypeScript + Vite (port 5173) + shadcn/ui
- **Backend**: Express + TypeScript + Bun (port 3000)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-5 Nano via Vercel AI SDK (`@ai-sdk/openai`)
- **Auth**: Better Auth (email/password, database sessions)
- **Job Queue**: pg-boss (PostgreSQL-backed, runs in `pgboss` schema)

## Project Structure

```
/core     - Shared code (Zod schemas, types) — Bun workspace package
/client   - React frontend (Vite)
/server   - Express backend
/e2e      - Playwright E2E tests
```

## Development

```bash
# Start server
cd server && bun run dev

# Start client
cd client && bun run dev
```

The client proxies `/api/*` requests to the server via Vite config (target is configurable via `VITE_API_URL` env var, defaults to `http://localhost:3000`).

## Key Conventions

- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Use context7 MCP server to fetch up-to-date documentation for libraries
- Use shadcn/ui components for all UI (import from `@/components/ui/*`)
- Use the `@/` path alias for imports (maps to `./src/`)
- Use shadcn's semantic color tokens (e.g. `bg-background`, `text-muted-foreground`, `text-destructive`) instead of hardcoded Tailwind colors
- Organize server endpoints into Express `Router` modules under `server/src/routes/` (e.g. `routes/users.ts`), mounted in `index.ts`
- Define shared Zod schemas in the `core` package under `core/schemas/` (e.g. `core/schemas/users.ts`) and import them in both client and server (e.g. `import { createUserSchema } from "core/schemas/users"`)
- Use Zod for validation (import from `zod/v4`)
- Validate request bodies in route handlers using the shared `validate` helper (`import { validate } from "../lib/validate"`). It takes a Zod schema, the request body, and the `res` object — returns parsed data or `null` (after sending a 400 response).
- Parse and validate numeric ID route params with the shared `parseId` helper (`import { parseId } from "../lib/parse-id"`). Returns a positive integer or `null` for invalid values.
- Do not wrap async route handlers in try/catch — Express 5 automatically catches rejected promises
- Use the shared `Role` constant instead of hardcoded `"admin"` / `"agent"` strings (import from `core/constants/role.ts`, e.g. `import { Role } from "core/constants/role.ts"`)
- Define shared constants and domain types in `core/constants/` as union types (not `enum` — the client has `erasableSyntaxOnly` enabled). Use `as const` objects when runtime access is needed (e.g. `Role`), and plain union types when only type checking is needed (e.g. `type TicketStatus = "open" | "resolved" | "closed"`).
- Use React Hook Form with Zod resolver for client-side form validation (`useForm` + `standardSchemaResolver` from `@hookform/resolvers/standard-schema`)
- Use Axios for HTTP requests (not `fetch`)
- Use TanStack React Query (`useQuery`, `useMutation`) for server state management (not `useEffect` + `useState`)
- Use the `ErrorAlert` component for error messages (`import ErrorAlert from "@/components/ErrorAlert"`). For static messages: `<ErrorAlert message="Failed to load data" />`. For mutation/query errors with automatic Axios message extraction: `<ErrorAlert error={mutation.error} fallback="Failed to save" />`.
- Use the `ErrorMessage` component for field validation errors (`import ErrorMessage from "@/components/ErrorMessage"`): `{errors.name && <ErrorMessage message={errors.name.message} />}`

## shadcn/ui Setup

- **Config**: `client/components.json` — style: default, baseColor: zinc, cssVariables: true
- **Theme**: `client/src/index.css` — OKLCH-based default theme using `@theme inline` with `var(--)` references (not `hsl(var(--))`); includes `@custom-variant dark`
- **cn utility**: `client/src/lib/utils.ts` — exports `cn` (clsx + tailwind-merge); use for all className merging in components
- **Adding components**: `bunx shadcn@latest add <component>` from `client/` — reads `components.json` automatically
- **Installed packages**: `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-label`, `lucide-react`
- **Existing UI components**: `button` (cva + Slot, supports `asChild`), `input`, `label`, `card`
- **Input error state**: use `aria-invalid={!!errors.field}` — the `Input` component styles itself via `aria-invalid`; do NOT use a custom `error` prop

## Job Queue (pg-boss)

- **Config**: `server/src/lib/queue.ts` — creates pg-boss instance using `DATABASE_URL`
- pg-boss auto-creates its own `pgboss` schema in PostgreSQL (no Prisma migration needed)
- `startQueue()` is called before `app.listen()` in the async `boot()` function in `index.ts`
- `stopQueue()` is called on `SIGTERM`/`SIGINT` for graceful shutdown
- To add a new background job: create a queue with `boss.createQueue()`, register a worker with `boss.work()` in `startQueue()`, and export a `send*Job()` function
- **Existing queues**:
  - `classify-ticket` — classifies inbound tickets via GPT (retryLimit: 3, retryDelay: 30s, exponential backoff)
  - `auto-resolve-ticket` — attempts to auto-resolve tickets via GPT; if unsuccessful, transitions status to `open`

## Ticket Lifecycle

- Inbound emails arrive via the `/api/webhooks/inbound-email` endpoint (SendGrid multipart format) and are created with status `new`
- The system enqueues `classify-ticket` and `auto-resolve-ticket` background jobs automatically
- Status flow: `new` → `processing` (AI working) → `open` (if not auto-resolved) or `resolved` (if auto-resolved)
- `new` and `processing` tickets are system-managed and never shown in the agent UI — agents only see `open`, `resolved`, and `closed` tickets
- The `/api/tickets` endpoint excludes `new` and `processing` tickets by default (no `status` filter param)

## Authentication

- **Library**: Better Auth with Prisma adapter (`better-auth/adapters/prisma`)
- **Server config**: `server/src/lib/auth.ts` — exports `auth`; mounted at `/api/auth/{*any}` in `index.ts` (must be registered before `express.json()`)
  - `emailAndPassword` enabled; trusts `CLIENT_URL` env var (defaults to `http://localhost:5173`)
  - `user.additionalFields.role` declared with `input: false` so it's included in session responses but cannot be set via the auth API
- **Client config**: `client/src/lib/auth-client.ts` — `createAuthClient()` with `inferAdditionalFields<typeof auth>()` plugin; exports `signIn`, `signOut`, `useSession`
  - `inferAdditionalFields` pulls the `role` type from the server `auth` instance — `session.user.role` is fully typed on the client
- **Middleware**: `server/src/middleware/require-auth.ts` — `requireAuth` async middleware; calls `auth.api.getSession` via `fromNodeHeaders`
  - Sets `req.user` (`{ id, email, name, role }`) and `req.session` (`{ id, token }`) on success; returns 401 if no session
- **Admin middleware**: `server/src/middleware/require-admin.ts` — `requireAdmin` middleware; returns 403 if `req.user.role !== Role.admin`; always stack after `requireAuth`: `router.get("/path", requireAuth, requireAdmin, handler)`
- **Route protection (client)**: `ProtectedRoute` wraps authenticated routes — shows a spinner while session is loading, redirects to `/login` if unauthenticated
- **Admin route protection (client)**: `AdminRoute` wraps admin-only routes — redirects unauthenticated to `/login`, redirects non-admins to `/`; uses `Role.admin` from `core/constants/role.ts`
- **Sign-up is disabled** — users are seeded via `prisma/seed.ts`
- **User roles**: `admin` and `agent` — Prisma `Role` enum on the `User` model (`role` field, default `agent`)
- **Prisma auth models**: `User`, `Session`, `Account`, `Verification` (all lowercase table names via `@@map`)

## Security

- **Helmet**: applied globally via `app.use(helmet())` in `index.ts`; `x-powered-by` header disabled
- **Rate limiting**: `express-rate-limit` on all `/api/auth/*` routes — 20 requests per 15 min window; skipped when `NODE_ENV !== "production"` via the `skip` option
- **Startup guard**: server throws on boot if `BETTER_AUTH_SECRET` is missing or starts with `"change-this"`
- **Session token**: never returned in API responses — `/api/me` returns only `{ user }`

## Testing

- **Prefer component tests** for the majority of coverage (rendering, states, data display, error handling). Reserve E2E tests for things that truly need a real browser + server: navigation, auth redirects, and full-stack integration flows (e.g. webhook creates data that appears in the UI).

### Component Tests
- **Framework**: Vitest + React Testing Library
- Run with `cd client && bun run test` (single run) or `bun run test:watch` (watch mode)
- Place test files next to the component: `ComponentName.test.tsx`
- Use `renderWithQuery` from `@/test/render` to wrap components that use TanStack React Query
- Mock Axios with `vi.mock("axios")` and `vi.mocked(axios, { deep: true })`

### E2E Tests
- **Framework**: Playwright — always use the `e2e-test-writer` agent for writing E2E tests; never write Playwright tests directly
- Run with `bun run test:e2e` from root
- Full setup, port config, seeded credentials, and test conventions are documented in the `e2e-test-writer` agent (`e2e/.claude/agents/e2e-test-writer.md`)
- **When to use**: only for scenarios that genuinely require a real browser + server — auth redirects, cross-page navigation, data persistence after reload, full-stack integration flows
- **When NOT to use**: rendering, component states, form validation, error messages, API call verification — use component tests for these
