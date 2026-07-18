import { expect, test } from "@playwright/test";
import {
  BRIDGE_START_GRID,
  MENU_HIT_HEIGHT,
  MENU_HIT_WIDTH,
  clearStorageAndReload,
  getSaveIndex,
  hitZoneScreenSize,
  menuItemPoint,
  saveSlotPoint,
  tapGamePoint,
  waitForGrid,
  waitForTitleScreen,
} from "./helpers.js";

// Menu order with an existing save and no unlocked commands:
// NEW GAME, CONTINUE, MANAGE SAVES, DELETE ALL SAVES.
const MENU = {
  NEW_GAME: 0,
  CONTINUE: 1,
  MANAGE_SAVES: 2,
  DELETE_ALL: 3,
};

async function createSaveByTouch(page, name) {
  await tapGamePoint(page, menuItemPoint(MENU.NEW_GAME));
  const input = page.locator("#title-input-overlay input");
  await expect(input).toBeVisible();
  await input.fill(name);
  await page.keyboard.press("Enter");
  await waitForGrid(page, BRIDGE_START_GRID, "bridge");
}

test.beforeEach(async ({ page }) => {
  await clearStorageAndReload(page);
  await waitForTitleScreen(page, "menu", "NEW GAME");
});

test("a single tap on NEW GAME opens the name dialog", async ({ page }) => {
  await tapGamePoint(page, menuItemPoint(MENU.NEW_GAME));
  await expect(page.locator("#title-input-overlay input")).toBeVisible();
});

// Regression: the boot loading overlay used to keep intercepting input for
// 500ms after the menu appeared, silently eating the player's first tap.
test("the boot overlay never blocks input once the menu is shown", async ({
  page,
}) => {
  const overlayBlocksInput = await page.evaluate(() => {
    const overlay = document.querySelector("#boot-loading");
    return overlay ? getComputedStyle(overlay).pointerEvents !== "none" : false;
  });
  expect(overlayBlocksInput).toBe(false);
});

test("the name input focuses on tap so the virtual keyboard can open", async ({
  page,
}) => {
  await tapGamePoint(page, menuItemPoint(MENU.NEW_GAME));
  const input = page.locator("#title-input-overlay input");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();

  // iOS Safari zooms the page when a focused input's font-size is below
  // 16px, which would break the carefully fitted layout.
  const fontSize = await input.evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize),
  );
  expect(fontSize).toBeGreaterThanOrEqual(16);
});

test("a touch user can start, quit, and continue a game", async ({ page }) => {
  test.setTimeout(60_000);

  await createSaveByTouch(page, "Touch Run");
  const index = await getSaveIndex(page);
  expect(index.slots).toHaveLength(1);
  expect(index.slots[0].name).toBe("Touch Run");

  await page.reload();
  await waitForTitleScreen(page, "menu", "CONTINUE");
  await tapGamePoint(page, menuItemPoint(MENU.CONTINUE));
  await waitForGrid(page, BRIDGE_START_GRID, "bridge");
});

test("a touch user can load a slot from MANAGE SAVES", async ({ page }) => {
  test.setTimeout(60_000);

  await createSaveByTouch(page, "Slot Touch Run");
  await page.reload();
  await waitForTitleScreen(page, "menu", "CONTINUE");

  await tapGamePoint(page, menuItemPoint(MENU.MANAGE_SAVES));
  await waitForTitleScreen(page, "saves");

  await tapGamePoint(page, saveSlotPoint(0));
  await expect(page.locator("#boot-loading")).toBeVisible({ timeout: 5_000 });
  await waitForGrid(page, BRIDGE_START_GRID, "bridge");
});

test("a touch user can delete all saves", async ({ page }) => {
  test.setTimeout(60_000);

  await createSaveByTouch(page, "Doomed Run");
  await page.reload();
  await waitForTitleScreen(page, "menu", "CONTINUE");

  await tapGamePoint(page, menuItemPoint(MENU.DELETE_ALL));
  const input = page.locator("#title-input-overlay input");
  await expect(input).toBeVisible();
  await input.fill("DELETE");
  await page.keyboard.press("Enter");

  await waitForTitleScreen(page, "menu", "NEW GAME");
  const index = await getSaveIndex(page);
  expect(index.slots).toHaveLength(0);
});

test("hovering is not required: a cold tap activates an unselected item", async ({
  page,
}) => {
  test.setTimeout(60_000);

  // CONTINUE is preselected when a save exists, so tapping MANAGE SAVES
  // exercises the tap-selects-and-activates path with no prior hover.
  await createSaveByTouch(page, "No Hover Run");
  await page.reload();
  await waitForTitleScreen(page, "menu", "CONTINUE");
  await tapGamePoint(page, menuItemPoint(MENU.MANAGE_SAVES));
  await waitForTitleScreen(page, "saves");
});

// Apple HIG and Material Design both call for interactive targets of at
// least 44×44 CSS px. The title menu's 540×50 game-space hit zones shrink
// with the canvas, dropping well below that on phones. Known usability
// gap — this test is expected to fail until the hit zones (or the scaled
// canvas) grow; Playwright will flag it the moment it starts passing.
test("title menu tap targets meet the 44px guideline", async ({ page }) => {
  test.fail();
  const size = await hitZoneScreenSize(page, MENU_HIT_WIDTH, MENU_HIT_HEIGHT);
  expect(size.height).toBeGreaterThanOrEqual(44);
});
