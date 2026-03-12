import { test, expect } from "@playwright/test";

test.describe("Page Load", () => {
  test("should render the header with app title and status", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "MyStoria" }),
    ).toBeVisible();
    await expect(page.getByText("Demo")).toBeVisible();
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });
  });

  test("should render the text input and send button", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByPlaceholder("Type a message..."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send" }),
    ).toBeVisible();
  });

  test("should enable text input once session is ready", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Send" }),
    ).toBeVisible();
  });

  test("should have no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.getByText("Ready")).toBeVisible({ timeout: 15000 });

    expect(errors).toEqual([]);
  });
});
