import { test, expect } from "@playwright/test";

test.describe("Audio Pipeline Latency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });
  });

  test("measures end-to-end message-to-ready latency", async ({
    page,
  }, testInfo) => {
    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Say hello in one short sentence.");

    const startMs = Date.now();
    await page.getByRole("button", { name: "Send" }).click();

    // Wait for Speaking status to appear (time-to-first-audio proxy)
    await expect(page.getByText("Speaking")).toBeVisible({ timeout: 30000 });
    const speakingMs = Date.now() - startMs;

    // Wait for Ready status (full pipeline complete)
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 60000 });
    const totalMs = Date.now() - startMs;

    testInfo.annotations.push(
      { type: "time_to_speaking_ms", description: String(speakingMs) },
      { type: "total_latency_ms", description: String(totalMs) },
    );

    // Sanity: total should be greater than time-to-speaking
    expect(totalMs).toBeGreaterThanOrEqual(speakingMs);
  });
});
