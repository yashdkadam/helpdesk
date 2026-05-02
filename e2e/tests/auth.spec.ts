import { test, expect, type Page } from "@playwright/test";
import { SERVER_URL } from "../test-env";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Performs a full login via the UI and waits for the redirect to /.
 * Returns after the navigation to "/" is confirmed.
 */
async function loginViaUI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}

/**
 * Calls the Better Auth sign-out API directly so we can log out between tests
 * without going through the UI. Uses the existing browser session cookies.
 */
async function logoutViaAPI(page: Page): Promise<void> {
  await page.request.post(`${SERVER_URL}/api/auth/sign-out`);
}

const ADMIN = { email: "admin@example.com", password: "password123" };
const AGENT = { email: "agent@example.com", password: "password123" };

// ---------------------------------------------------------------------------
// Login page — unauthenticated behaviour
// ---------------------------------------------------------------------------

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the sign-in form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Helpdesk" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("already-authenticated user is redirected away from /login", async ({
    page,
  }) => {
    // Log in first via UI, then manually navigate back to /login —
    // the page should bounce the authenticated user back to /.
    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// Successful login
// ---------------------------------------------------------------------------

test.describe("Successful login", () => {
  test("agent can sign in and lands on /", async ({ page }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await expect(page).toHaveURL("/");
    // Navbar should show the user's name, confirming session was established
    await expect(page.getByText("Agent")).toBeVisible();
  });

  test("admin can sign in and lands on /", async ({ page }) => {
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("admin sees the Users nav link; agent does not", async ({ page }) => {
    // Admin should see the link
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();

    await logoutViaAPI(page);

    // Agent should NOT see the link after logging in
    await loginViaUI(page, AGENT.email, AGENT.password);
    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Failed login
// ---------------------------------------------------------------------------

test.describe("Failed login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("wrong password shows an error alert and stays on /login", async ({
    page,
  }) => {
    await page.getByLabel("Email address").fill(AGENT.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should remain on /login — no navigation
    await expect(page).toHaveURL("/login");
    // An error alert should appear (ErrorAlert renders the server message)
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("unknown email shows an error alert and stays on /login", async ({
    page,
  }) => {
    await page.getByLabel("Email address").fill("nobody@example.com");
    await page.getByLabel("Password").fill("whatever");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("alert")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.describe("Logout", () => {
  test("Sign out button redirects to /login", async ({ page }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("session is destroyed after sign-out — revisiting / redirects to /login", async ({
    page,
  }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    // Attempt to navigate directly to the protected route
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// ProtectedRoute — unauthenticated access
// ---------------------------------------------------------------------------

test.describe("ProtectedRoute redirects", () => {
  test("unauthenticated user visiting / is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("unauthenticated user visiting /users is redirected to /login", async ({
    page,
  }) => {
    // AdminRoute also checks for a session first, so unauthenticated → /login
    await page.goto("/users");
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// AdminRoute — role-based access
// ---------------------------------------------------------------------------

test.describe("AdminRoute redirects", () => {
  test("agent visiting /users is redirected to /", async ({ page }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/users");
    await expect(page).toHaveURL("/");
  });

  test("admin visiting /users sees the Users page", async ({ page }) => {
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Session persistence across page reloads
// ---------------------------------------------------------------------------

test.describe("Session persistence", () => {
  test("session survives a hard reload — user remains authenticated", async ({
    page,
  }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.reload();
    // After a full reload the app must re-hydrate the session from the cookie
    // and stay on / rather than bouncing to /login
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Agent")).toBeVisible();
  });

  test("admin session survives a hard reload and retains admin privileges", async ({
    page,
  }) => {
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await page.reload();
    await expect(page).toHaveURL("/");
    // Users link is only rendered for admins — its presence confirms the role
    // survived the reload
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });
});
