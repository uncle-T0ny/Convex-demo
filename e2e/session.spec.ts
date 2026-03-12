import { test, expect } from "@playwright/test";

test.describe("Session Management", () => {
  test("should create a session and store it in localStorage", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for session to be ready (input enabled)
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sessionId = await page.evaluate(() =>
      localStorage.getItem("mystoria-session-id"),
    );
    expect(sessionId).toBeTruthy();
  });

  test("should restore session on page reload", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sessionBefore = await page.evaluate(() =>
      localStorage.getItem("mystoria-session-id"),
    );

    await page.reload();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sessionAfter = await page.evaluate(() =>
      localStorage.getItem("mystoria-session-id"),
    );

    expect(sessionAfter).toBe(sessionBefore);
  });

  test("should show greeting message after session creation", async ({
    page,
  }) => {
    // Clear any existing session for a fresh start
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.removeItem("mystoria-session-id"),
    );
    await page.reload();

    // Wait for greeting to appear (assistant message bubble)
    await expect(
      page.locator(".bg-white.text-gray-900.shadow-sm").first(),
    ).toBeVisible({ timeout: 30000 });
  });

  test("should persist messages across page reload", async ({ page }) => {
    await page.goto("/");

    // Wait for greeting
    const assistantBubble = page.locator(
      ".bg-white.text-gray-900.shadow-sm",
    );
    await expect(assistantBubble.first()).toBeVisible({ timeout: 30000 });

    // Get greeting text
    const greetingText = await assistantBubble.first().textContent();

    // Reload
    await page.reload();

    // Greeting should still be there
    await expect(assistantBubble.first()).toBeVisible({ timeout: 15000 });
    await expect(assistantBubble.first()).toContainText(
      greetingText!.slice(0, 20),
    );
  });

  test("should show Ready status after reload (no TTS replay)", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });

    await page.reload();

    // Status should settle to "Ready" — not "Speaking..."
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });
  });
});
