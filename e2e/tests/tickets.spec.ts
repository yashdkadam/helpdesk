import { test, expect, type Page } from "@playwright/test";
import { SERVER_URL, TEST_WEBHOOK_SECRET } from "../test-env";

const WEBHOOK_URL = `${SERVER_URL}/api/webhooks/inbound-email`;
const AGENT = { email: "agent@example.com", password: "password123" };

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}

async function createTicketViaWebhook(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  fields: { from: string; subject: string; text: string }
) {
  const res = await request.post(WEBHOOK_URL, {
    headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
    multipart: fields,
  });
  expect(res.status()).toBe(202);
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

test.describe("Ticket list — empty state", () => {
  test("shows empty message when there are no tickets", async ({ page }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/tickets");
    await expect(page.getByText("No tickets yet.")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Ticket display
// ---------------------------------------------------------------------------

test.describe("Ticket list — display", () => {
  test("shows subject, sender name, and open status after classify job runs", async ({ page, request }) => {
    await createTicketViaWebhook(request, {
      from: "Alice <alice@example.com>",
      subject: "My order is missing",
      text: "Hello, I never received my package.",
    });

    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/tickets");

    // Allow time for the classify-ticket job to transition new → open
    await expect(page.getByText("My order is missing")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("open")).toBeVisible();
  });

  test("shows the Tickets nav link for all authenticated users", async ({ page }) => {
    await loginViaUI(page, AGENT.email, AGENT.password);
    await expect(page.getByRole("link", { name: "Tickets" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sort order
// ---------------------------------------------------------------------------

test.describe("Ticket list — sort order", () => {
  test("newest ticket appears above older ticket", async ({ page, request }) => {
    const older = `Older ticket ${Date.now()}`;
    await createTicketViaWebhook(request, {
      from: "a@example.com",
      subject: older,
      text: "body",
    });

    const newer = `Newer ticket ${Date.now()}`;
    await createTicketViaWebhook(request, {
      from: "b@example.com",
      subject: newer,
      text: "body",
    });

    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/tickets");

    // Wait for both tickets to be visible (classify job has run for both)
    await expect(page.getByText(newer)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(older)).toBeVisible();

    // Compare DOM positions — newer should have a lower row index
    const subjectCells = page.locator("tbody tr td:nth-child(2)");
    const texts = await subjectCells.allTextContents();
    const newerIdx = texts.findIndex((t) => t.includes(newer));
    const olderIdx = texts.findIndex((t) => t.includes(older));
    expect(newerIdx).toBeLessThan(olderIdx);
  });
});
