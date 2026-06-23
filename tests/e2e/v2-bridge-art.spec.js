import { expect, test } from "@playwright/test";

test("v2 bridge debug path exposes the generated backdrop", async ({ page }) => {
  test.setTimeout(30_000);

  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/?testMode=1&useV2Zones=1");
  await page.reload();
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "bridge",
  );
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-art",
    "bridge-background",
  );
});
