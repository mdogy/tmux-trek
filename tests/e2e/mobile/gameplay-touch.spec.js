import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  gamePointToPage,
  waitForGrid,
} from "./helpers.js";

const BRIDGE_START_GRID = [7, 8];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("tmux-trek:test-storage-cleared")) {
      window.localStorage.clear();
      window.sessionStorage.setItem("tmux-trek:test-storage-cleared", "1");
    }
  });
  await page.goto("/?testMode=1");
  await waitForGrid(page, BRIDGE_START_GRID, "bridge");
});

// Grid movement is keyboard-only today; a tap on the play field must at
// least be inert — no thrown errors, no teleporting the player.
test("tapping the play field is safe while movement stays keyboard-driven", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err));

  const center = await gamePointToPage(page, { x: 480, y: 360 });
  await page.touchscreen.tap(center.x, center.y);
  const corner = await gamePointToPage(page, { x: 120, y: 120 });
  await page.touchscreen.tap(corner.x, corner.y);
  await page.waitForTimeout(500);

  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-player-grid",
    `${BRIDGE_START_GRID[0]},${BRIDGE_START_GRID[1]}`,
  );
  expect(errors).toHaveLength(0);
});

test("the flash-card review overlay is fully touch-operable", async ({
  page,
}) => {
  await page.evaluate(() => {
    const app = window.__tmuxTrekApp;
    app.state.restoreUnlockedCommands(["tmux"]);
    app.saveProgress();
  });

  await page.locator("#review-button").scrollIntoViewIfNeeded();
  await page.locator("#review-button").tap();
  await expect(page.locator("#review-root")).toHaveAttribute(
    "data-review-mode",
    "flashcards",
  );

  await page.getByRole("button", { name: "Flip Card" }).tap();
  await expect(page.locator("#review-root")).toContainText("tmux");
  await page.getByRole("button", { name: "Close" }).tap();
  await expect(page.locator("#review-root")).toHaveClass(/hidden/);
});

test("the first terminal challenge is reachable and fits a phone screen", async ({
  page,
}) => {
  test.setTimeout(60_000);

  // Walk to the Rift terminal. Movement needs key events — on a real
  // phone that means an external keyboard; the touch-facing surface
  // being verified here is the dialogue and terminal chrome.
  await page.locator("#game-root").focus();
  await page.keyboard.press("KeyD");
  await expect
    .poll(() => page.locator("#game-root").getAttribute("data-player-grid"))
    .toBe("8,8");
  await page.keyboard.press("KeyE");
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);

  // Dialogue advances by tapping its Continue button, not by keyboard.
  const advance = page.locator('[data-action="dialogue-advance"]');
  while (await advance.isVisible()) {
    await advance.tap();
    await page.waitForTimeout(120);
  }

  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "bridge-open-rift",
  );
  await expect(page.locator("#terminal-root")).not.toHaveClass(/hidden/);
  await expectNoHorizontalOverflow(page);

  // The terminal must hold focus when it opens or a phone's virtual
  // keyboard will never appear.
  const focusInTerminal = await page.evaluate(() =>
    document.querySelector("#terminal-root")?.contains(document.activeElement),
  );
  expect(focusInTerminal).toBe(true);

  await page.keyboard.type("tmux");
  await page.keyboard.press("Enter");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await waitForGrid(page, [1, 15], "surface");
});

test("progress made on a phone survives a reload", async ({ page }) => {
  await page.reload();
  await waitForGrid(page, BRIDGE_START_GRID, "bridge");
  await expect(page.locator("#mission-text")).toContainText(
    "Open the Rift terminal",
  );
});
