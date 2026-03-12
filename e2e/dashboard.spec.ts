import { test, expect } from "@playwright/test";

test.describe("Dashboard Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tap to start conversation" }).click();
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });
  });

  test("should render dashboard heading", async ({ page }) => {
    await expect(page.getByText("Dashboard", { exact: false })).toBeVisible();
  });

  test("should render Today's Tasks section", async ({ page }) => {
    await expect(
      page.getByText("Today's Tasks", { exact: false }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should render task items with completion counter", async ({
    page,
  }) => {
    // Wait for dashboard data to load
    await expect(page.getByText(/\d+\/\d+ completed/)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should render Next Appointment section", async ({ page }) => {
    await expect(
      page.getByText("Next Appointment", { exact: false }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show cycle day badge", async ({ page }) => {
    await expect(page.getByText(/Day \d+/)).toBeVisible({ timeout: 10000 });
  });
});
