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

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

test.describe("Webhook authentication", () => {
  test("returns 401 when X-Webhook-Secret header is missing", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      multipart: {
        from: "Alice <alice@example.com>",
        subject: "Missing secret test",
        text: "Hello",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 401 when X-Webhook-Secret header is wrong", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": "wrong-secret" },
      multipart: {
        from: "Alice <alice@example.com>",
        subject: "Wrong secret test",
        text: "Hello",
      },
    });
    expect(res.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe("Webhook validation", () => {
  test("returns 400 when 'from' field is missing", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
      multipart: {
        subject: "No from field",
        text: "Hello",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("returns 400 when 'subject' field is missing", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
      multipart: {
        from: "Alice <alice@example.com>",
        text: "Hello",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("returns 400 when both 'text' and 'html' are missing", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
      multipart: {
        from: "Alice <alice@example.com>",
        subject: "No body",
      },
    });
    expect(res.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Happy path — full-stack integration
// ---------------------------------------------------------------------------

test.describe("Webhook happy path", () => {
  test("ticket created via webhook appears in the ticket list UI", async ({ page, request }) => {
    const subject = `E2E inbound email ${Date.now()}`;

    const res = await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
      multipart: {
        from: "Alice <alice@example.com>",
        subject,
        text: "Hello, I need help with my order.",
      },
    });
    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.id).toBeDefined();

    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/tickets");

    // classify-ticket job transitions new → open asynchronously; allow time for the worker
    await expect(page.getByText(subject)).toBeVisible({ timeout: 10000 });
  });

  test("sender name from 'Name <email>' format is shown in the ticket list", async ({ page, request }) => {
    const subject = `Sender parse test ${Date.now()}`;

    await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
      multipart: {
        from: "Bob Smith <bob@example.com>",
        subject,
        text: "Test body",
      },
    });

    await loginViaUI(page, AGENT.email, AGENT.password);
    await page.goto("/tickets");

    await expect(page.getByText(subject)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Bob Smith")).toBeVisible();
  });

  test("html body is accepted as a fallback when text is absent", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      headers: { "X-Webhook-Secret": TEST_WEBHOOK_SECRET },
      multipart: {
        from: "Carol <carol@example.com>",
        subject: "HTML only ticket",
        html: "<p>Hello from HTML</p>",
      },
    });
    expect(res.status()).toBe(202);
  });
});
