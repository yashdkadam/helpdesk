---
name: Established test patterns for this helpdesk E2E suite
description: Reusable helper patterns, selector conventions, and reliability rules validated in auth.spec.ts
type: feedback
---

## Rule: Use a `loginViaUI` helper for all tests that need an authenticated session

```typescript
async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}
```

**Why:** Keeps tests DRY without needing `storageState` files. The label text "Email address" (not "Email") matches the `<Label htmlFor="email">Email address</Label>` in LoginPage.tsx exactly.

**How to apply:** Copy this helper into any spec file that needs authentication. If you need a `storageState`-based approach for performance, generate it by running `loginViaUI` in a `setup` project.

---

## Rule: Use `page.request.post` to call sign-out API between sub-tests

```typescript
async function logoutViaAPI(page: Page): Promise<void> {
  await page.request.post(`${SERVER_URL}/api/auth/sign-out`);
}
```

**Why:** Avoids navigating the page, which would disrupt the next test's state setup. The Better Auth sign-out endpoint is `POST /api/auth/sign-out`.

**How to apply:** Use between role-switching assertions within the same test (or in `afterEach` if tests share browser state). Import `SERVER_URL` from `../test-env`.

---

## Rule: Confirm successful authentication via Navbar name, not just URL

After `loginViaUI`, assert `await expect(page.getByText("Agent")).toBeVisible()` in addition to URL check.

**Why:** The URL changes on redirect but the session data (name from DB) only appears once the `/api/auth/get-session` round-trip completes. The text assertion ensures the full auth round-trip succeeded.

---

## Rule: ErrorAlert renders with `role="alert"` — use that for login failure assertions

`await expect(page.getByRole("alert")).toBeVisible()`

**Why:** The `ErrorAlert` component wraps the error in an element with `role="alert"`. This is more robust than matching specific error text that may come from the server and change.
