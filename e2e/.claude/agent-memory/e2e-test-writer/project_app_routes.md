---
name: Client-side route definitions and guards
description: All routes in App.tsx, which guard wraps them, and what each page renders
type: project
---

## Routes (`client/src/App.tsx`)

| Path     | Guard           | Page component | Notes                                      |
|----------|-----------------|----------------|--------------------------------------------|
| /login   | none            | LoginPage      | Redirects to / if already authenticated    |
| /        | ProtectedRoute  | HomePage       | Shows Navbar with "Welcome" heading        |
| /users   | AdminRoute      | UsersPage      | Shows "Users" heading (h1)                 |

## Guard behaviour

**ProtectedRoute** (`client/src/components/ProtectedRoute.tsx`)
- While session loading: full-screen spinner
- No session: `<Navigate to="/login" replace />`
- Session present: renders children

**AdminRoute** (`client/src/components/AdminRoute.tsx`)
- While session loading: full-screen spinner
- No session: `<Navigate to="/login" replace />`
- Session present but role !== "admin": `<Navigate to="/" replace />`
- Admin session: renders children

## Navbar (`client/src/components/Navbar.tsx`)
- Always visible on protected pages
- Shows user's `name` from session
- "Users" link (`/users`) only rendered when `session.user.role === "admin"`
- "Sign out" button calls `signOut()` then navigates to /login

## Why:
Needed to know which selectors reliably confirm successful navigation (page headings, nav items) vs which are role-conditional (Users link).

## How to apply:
Use `getByRole("heading", { name: "Users" })` to confirm /users loaded. Use `getByRole("link", { name: "Users" })` only for admin role assertions. Use `getByText(userName)` in the navbar to confirm session was established.
