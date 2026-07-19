import { expect, test } from "@playwright/test";
import {
  clearStorageAndReload,
  expectCanvasFitsPanel,
  expectNoHorizontalOverflow,
  menuItemPoint,
  setOrientation,
  tapGamePoint,
  waitForTitleScreen,
} from "./helpers.js";

test("rotating on the title screen keeps the menu tappable", async ({
  page,
}) => {
  await clearStorageAndReload(page);
  await waitForTitleScreen(page, "menu", "NEW GAME");

  await setOrientation(page, "landscape");
  await expectCanvasFitsPanel(page);
  await expectNoHorizontalOverflow(page);

  await tapGamePoint(page, menuItemPoint(0));
  await expect(page.locator("#title-input-overlay input")).toBeVisible();
});

test("rotating mid-game preserves state and refits the canvas", async ({
  page,
}) => {
  await page.goto("/?testMode=1");
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "bridge",
    { timeout: 15_000 },
  );
  const gridBefore = await page
    .locator("#game-root")
    .getAttribute("data-player-grid");

  await setOrientation(page, "landscape");
  await expectCanvasFitsPanel(page);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-player-grid",
    gridBefore,
  );

  await setOrientation(page, "portrait");
  await expectCanvasFitsPanel(page);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-player-grid",
    gridBefore,
  );
});

test("rotating with the name dialog open keeps the input usable", async ({
  page,
}) => {
  await clearStorageAndReload(page);
  await waitForTitleScreen(page, "menu", "NEW GAME");

  await tapGamePoint(page, menuItemPoint(0));
  const input = page.locator("#title-input-overlay input");
  await expect(input).toBeVisible();
  await input.fill("Rotated Run");

  await setOrientation(page, "landscape");
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("Rotated Run");
  await expectNoHorizontalOverflow(page);
});
