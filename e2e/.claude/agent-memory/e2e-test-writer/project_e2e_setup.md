---
name: E2E test environment setup
description: Playwright config, ports, credentials, global-setup, and seed data for the helpdesk E2E suite
type: project
---

## Ports and URLs
- Test server: port 3001 (`SERVER_URL = http://localhost:3001`)
- Test client: port 5174 (`CLIENT_URL = http://localhost:5174`)
- Playwright `baseURL` = `CLIENT_URL`
- Both defined in `e2e/test-env.ts`

## Playwright config
- Config file: `e2e/playwright.config.ts`
- `testDir`: `./tests`
- `globalSetup`: `./global-setup.ts`
- Single project: Chromium (Desktop Chrome)
- `reuseExistingServer: !process.env.CI` — servers are reused locally, always fresh on CI
- Server started with `bun run src/index.ts` from `../server`
- Client started with `bunx vite --port 5174` from `../client`

## Global setup (`e2e/global-setup.ts`)
- Runs `bunx prisma migrate deploy` against the test DB
- Runs `bun run prisma/seed.e2e.ts` to seed test users

## Seeded users (`server/prisma/seed.e2e.ts`)
- Clears all auth tables before seeding (clean slate)
- `admin@example.com` / `password123` — role: admin
- `agent@example.com` / `password123` — role: agent
- Created fresh once per test suite run (not before each test)

## Why:
The global setup ensures a deterministic starting state for every test run, but tests themselves must not mutate shared user records or leave behind sessions that affect other tests. Logout via API helper (`POST /api/auth/sign-out`) is preferred over UI sign-out when cleaning up between sub-tests within a single spec file.

## How to apply:
Always import credentials from the constants above (do not hardcode). Be aware that the seed runs once globally — if a test mutates a user record, it may break subsequent tests in the same run.
