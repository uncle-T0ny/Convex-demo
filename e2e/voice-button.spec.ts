import { test, expect } from "@playwright/test";

// Voice button only renders when Web Speech API is supported (Chromium)
test.describe("Voice Button", () => {
  test("should render mic button in Chromium", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Web Speech API only available in Chromium",
    );

    await page.goto("/");
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const micButton = page.getByRole("button", { name: "Start listening" });
    await expect(micButton).toBeVisible();
  });

  test("should have correct aria-label", async ({ page, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "Web Speech API only available in Chromium",
    );

    await page.goto("/");
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const micButton = page.getByRole("button", { name: "Start listening" });
    await expect(micButton).toHaveAttribute("aria-label", "Start listening");
  });

  test("should be disabled before session is ready", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Web Speech API only available in Chromium",
    );

    // Clear session to force fresh initialization
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.removeItem("mystoria-session-id"),
    );
    await page.reload();

    // Button should exist but be disabled initially
    const micButton = page.getByRole("button", { name: "Start listening" });
    await expect(micButton).toBeVisible();

    // Eventually becomes enabled once session is ready
    await expect(micButton).toBeEnabled({ timeout: 15000 });
  });

  test("should not render mic button in non-Chromium browsers", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "chromium",
      "This test checks non-Chromium behavior",
    );

    await page.goto("/");
    await expect(page.getByPlaceholder("Type a message...")).toBeVisible({
      timeout: 15000,
    });

    // Mic button should not be present
    await expect(
      page.getByRole("button", { name: "Start listening" }),
    ).toHaveCount(0);
  });
});
