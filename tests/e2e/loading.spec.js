import { expect, test } from "@playwright/test";

test("the game shows a loading overlay before the first scene appears", async ({
  page,
}) => {
  test.setTimeout(30_000);

  await page.goto("/");
  await expect(page.locator("#boot-loading")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#boot-loading")).toHaveCount(0);
});
