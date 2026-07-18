import { expect } from "@playwright/test";

export const TITLE_READY_TIMEOUT = 15_000;
export const GRID_READY_TIMEOUT = 15_000;
export const BRIDGE_START_GRID = [7, 8];

// TitleScene lays out the game in a fixed 960×720 coordinate space and
// Phaser scales the canvas to fit the panel. These mirror the layout
// constants in src/game/scenes/TitleScene.js.
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 720;
export const MENU_FIRST_Y = 330;
export const MENU_STEP_Y = 58;
export const MENU_HIT_WIDTH = 540;
export const MENU_HIT_HEIGHT = 50;
export const SLOT_FIRST_Y = 320;
export const SLOT_STEP_Y = 40;
export const SLOT_HIT_HEIGHT = 36;

export function menuItemPoint(index) {
  return { x: GAME_WIDTH / 2, y: MENU_FIRST_Y + index * MENU_STEP_Y };
}

export function saveSlotPoint(index) {
  return { x: GAME_WIDTH / 2, y: SLOT_FIRST_Y + index * SLOT_STEP_Y };
}

export async function clearStorageAndReload(page) {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
}

export async function waitForTitleScreen(page, screen, selectionPattern) {
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-title-screen",
    screen,
    { timeout: TITLE_READY_TIMEOUT },
  );
  if (selectionPattern) {
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-title-selection",
      selectionPattern,
      { timeout: TITLE_READY_TIMEOUT },
    );
  }
}

export async function waitForGrid(page, grid, zoneId) {
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-player-grid",
    `${grid[0]},${grid[1]}`,
    { timeout: GRID_READY_TIMEOUT },
  );
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    zoneId,
  );
}

// Late web-font loads reflow the masthead and shift the canvas, so a
// coordinate read too early can aim a tap at where the canvas used to be.
async function waitForStableCanvasBox(page) {
  await page.evaluate(() => document.fonts?.ready);
  let previous = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const box = await page.locator("canvas").boundingBox();
    if (
      box &&
      previous &&
      Math.abs(box.x - previous.x) < 0.5 &&
      Math.abs(box.y - previous.y) < 0.5 &&
      Math.abs(box.width - previous.width) < 0.5 &&
      Math.abs(box.height - previous.height) < 0.5
    ) {
      return box;
    }
    previous = box;
    await page.waitForTimeout(100);
  }
  throw new Error("game canvas never settled into a stable position");
}

// Maps a point in the 960×720 game space to page coordinates through the
// scaled canvas rect.
export async function gamePointToPage(page, point) {
  const box = await waitForStableCanvasBox(page);
  return {
    x: box.x + (box.width * point.x) / GAME_WIDTH,
    y: box.y + (box.height * point.y) / GAME_HEIGHT,
  };
}

// Taps a game-space point with a real touch event (touchstart/touchend),
// not a synthesized mouse click, so it exercises the same input path a
// phone user does. Waits out any input-blocking loading overlay first,
// like a real player would.
export async function tapGamePoint(page, point) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const overlay = document.querySelector("#boot-loading");
        return !overlay || getComputedStyle(overlay).pointerEvents === "none";
      }),
    )
    .toBe(true);
  const { x, y } = await gamePointToPage(page, point);
  await page.touchscreen.tap(x, y);
}

export async function getSaveIndex(page) {
  return page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("tmux-trek:saves") ?? "{}"),
  );
}

// Returns the on-screen CSS-pixel size of a game-space hit zone after
// canvas scaling — the size a fingertip actually has to hit.
export async function hitZoneScreenSize(page, gameWidth, gameHeight) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) {
    throw new Error("game canvas is not visible");
  }
  return {
    width: (box.width * gameWidth) / GAME_WIDTH,
    height: (box.height * gameHeight) / GAME_HEIGHT,
  };
}

export async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
}

export async function expectCanvasFitsPanel(page) {
  await page.waitForSelector("canvas", { timeout: 15_000 });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const panel = document.querySelector(".viewport-panel");
        const canvas = document.querySelector("canvas");
        if (!panel || !canvas) return false;

        const panelRect = panel.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return (
          canvasRect.width > 0 &&
          canvasRect.height > 0 &&
          canvasRect.width <= panelRect.width + 1 &&
          canvasRect.height <= panelRect.height + 1
        );
      }),
    )
    .toBe(true);
}

export async function setOrientation(page, orientation) {
  const size = page.viewportSize();
  const [long, short] = [
    Math.max(size.width, size.height),
    Math.min(size.width, size.height),
  ];
  if (orientation === "landscape") {
    await page.setViewportSize({ width: long, height: short });
  } else {
    await page.setViewportSize({ width: short, height: long });
  }
}
