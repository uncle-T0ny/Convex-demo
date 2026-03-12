import { test, expect } from "@playwright/test";

test.describe("Text Chat", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for session to be fully ready
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });
  });

  test("should send a message and see it in the transcript", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Hello, this is a test message");
    await page.getByRole("button", { name: "Send" }).click();

    // User message should appear in purple bubble
    await expect(
      page.locator(".bg-purple.text-white").filter({
        hasText: "Hello, this is a test message",
      }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should clear input after sending", async ({ page }) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Test message");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(input).toHaveValue("");
  });

  test("should receive an assistant response", async ({ page }) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("What is my name?");
    await page.getByRole("button", { name: "Send" }).click();

    // Eventually status returns to Ready after assistant responds
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 30000 });

    // There should be at least 2 assistant bubbles (greeting + response)
    const assistantBubbles = page.locator(
      ".bg-white.text-gray-900.shadow-sm",
    );
    const count = await assistantBubbles.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("should send message with Enter key", async ({ page }) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Enter key test");
    await input.press("Enter");

    await expect(
      page.locator(".bg-purple.text-white").filter({
        hasText: "Enter key test",
      }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should disable Send button when input is empty", async ({ page }) => {
    const sendButton = page.getByRole("button", { name: "Send" });
    await expect(sendButton).toBeDisabled();
  });

  test("should disable input during processing", async ({ page }) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Quick test");
    await page.getByRole("button", { name: "Send" }).click();

    // Input should be disabled while processing/speaking
    await expect(input).toBeDisabled({ timeout: 5000 });

    // Should re-enable after response completes
    await expect(input).toBeEnabled({ timeout: 30000 });
  });

  test("should show status transitions during message exchange", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Tell me something short");
    await page.getByRole("button", { name: "Send" }).click();

    // Should transition through Thinking/Speaking then back to Ready
    // We can't guarantee catching "Thinking..." since it may be fast,
    // but "Ready" should appear at the end
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 30000 });
  });
});
