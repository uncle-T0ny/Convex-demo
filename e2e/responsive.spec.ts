import { test, expect } from "@playwright/test";

test.describe("Responsive Layout", () => {
  test("should show sidebar on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("should hide sidebar on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeInViewport();
  });

  test("should show menu toggle on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const menuButton = page.getByRole("button", {
      name: "Toggle dashboard",
    });
    await expect(menuButton).toBeVisible();
  });

  test("should hide menu toggle on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    const menuButton = page.getByRole("button", {
      name: "Toggle dashboard",
    });
    await expect(menuButton).not.toBeVisible();
  });

  test("should open sidebar when menu toggle is clicked on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "Toggle dashboard" }).click();

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeInViewport();
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("should keep text input usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();

    const input = page.getByPlaceholder("Type a message...");
    await expect(input).toBeEnabled({ timeout: 15000 });

    const sendButton = page.getByRole("button", { name: "Send" });
    await expect(sendButton).toBeVisible();
  });
});
