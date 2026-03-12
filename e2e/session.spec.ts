import { test, expect } from "@playwright/test";

test.describe("Session Management", () => {
  test("should create a session and store it in localStorage", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sessionId = await page.evaluate(() =>
      localStorage.getItem("mystoria-session-id"),
    );
    expect(sessionId).toBeTruthy();
  });

  test("should create a new session on page reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sessionBefore = await page.evaluate(() =>
      localStorage.getItem("mystoria-session-id"),
    );

    await page.reload();
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sessionAfter = await page.evaluate(() =>
      localStorage.getItem("mystoria-session-id"),
    );

    // App creates a fresh session on every mount
    expect(sessionAfter).toBeTruthy();
    expect(sessionBefore).toBeTruthy();
    expect(sessionAfter).not.toBe(sessionBefore);
  });

  test("should show greeting message after session creation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.removeItem("mystoria-session-id"),
    );
    await page.reload();
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    // Wait for greeting to appear (assistant message bubble)
    await expect(
      page.locator("[data-testid='assistant-message']").first(),
    ).toBeVisible({ timeout: 30000 });
  });

  test("should show Ready status after start", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });
  });
});
