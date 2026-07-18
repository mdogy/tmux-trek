import { expect, test } from "@playwright/test";
import {
  clearStorageAndReload,
  expectCanvasFitsPanel,
  expectNoHorizontalOverflow,
  setOrientation,
  waitForTitleScreen,
} from "./helpers.js";

test.describe("title screen layout", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorageAndReload(page);
    await waitForTitleScreen(page, "menu", "NEW GAME");
  });

  test("fits the viewport in portrait", async ({ page }) => {
    await expectCanvasFitsPanel(page);
    await expectNoHorizontalOverflow(page);
  });

  test("fits the viewport in landscape", async ({ page }) => {
    await setOrientation(page, "landscape");
    await expectCanvasFitsPanel(page);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("in-game layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testMode=1");
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-zone-id",
      "bridge",
      { timeout: 15_000 },
    );
  });

  test("keeps the playable canvas inside the panel", async ({ page }) => {
    await expectCanvasFitsPanel(page);
    await expectNoHorizontalOverflow(page);
  });

  test("stacks the sidebar below the game on narrow viewports", async ({
    page,
  }) => {
    const { width } = page.viewportSize();
    test.skip(width > 980, "sidebar only stacks below the 980px breakpoint");

    const panel = await page.locator(".viewport-panel").boundingBox();
    const sidebar = await page.locator(".sidebar").boundingBox();
    expect(sidebar.y).toBeGreaterThanOrEqual(panel.y + panel.height - 1);
  });

  test("sidebar panels and mission text are visible after scrolling", async ({
    page,
  }) => {
    await page.locator("#mission-text").scrollIntoViewIfNeeded();
    await expect(page.locator("#mission-text")).toBeVisible();
    await expect(page.locator("#zone-name")).toBeVisible();
    await page.locator("#review-button").scrollIntoViewIfNeeded();
    await expect(page.locator("#review-button")).toBeVisible();
  });

  test("review button meets the 44px touch-target guideline", async ({
    page,
  }) => {
    await page.locator("#review-button").scrollIntoViewIfNeeded();
    const box = await page.locator("#review-button").boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
