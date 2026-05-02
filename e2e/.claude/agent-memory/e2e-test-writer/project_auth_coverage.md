---
name: Auth E2E coverage map
description: What auth scenarios are already covered in e2e/tests/auth.spec.ts, to avoid duplication
type: project
---

## File: `e2e/tests/auth.spec.ts`

### Login page (unauthenticated)
- Renders form (heading, email label, password label, submit button)
- Already-authenticated user hitting /login is bounced to /

### Successful login
- Agent signs in → lands on /  → name visible in Navbar
- Admin signs in → lands on /  → name visible in Navbar
- Admin sees "Users" nav link; agent does not

### Failed login
- Wrong password → stays on /login, alert role appears
- Unknown email → stays on /login, alert role appears

### Logout
- "Sign out" button → navigates to /login
- After sign-out, navigating to / redirects to /login (session destroyed)

### ProtectedRoute redirects
- Unauthenticated GET / → /login
- Unauthenticated GET /users → /login (AdminRoute also checks session first)

### AdminRoute redirects
- Agent GET /users → redirected to /
- Admin GET /users → /users, "Users" heading visible

### Session persistence
- Agent: hard reload on / → stays on /, name still visible
- Admin: hard reload on / → stays on /, "Users" link still visible (role persisted)

## Why:
Tracking coverage here prevents writing duplicate tests and makes it easy to see which flows are not yet covered.

## How to apply:
Before adding new auth tests, check this map. If the scenario is already covered, skip it. When adding new tests, update this file.
