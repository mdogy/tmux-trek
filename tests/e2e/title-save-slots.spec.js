import { expect, test } from "@playwright/test";

const GRID_READY_TIMEOUT = 15_000;
const TITLE_READY_TIMEOUT = 15_000;

async function waitForGrid(page, grid, zoneId) {
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

async function getSaveIndex(page) {
  return page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("tmux-trek:saves") ?? "{}"),
  );
}

async function waitForTitleScreen(page, screen, selectionPattern) {
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

async function pressTitleKey(page, key) {
  await page.locator("#game-root").focus();
  await page.keyboard.press(key);
}

async function openNewGameDialog(page) {
  await pressTitleKey(page, "Enter");
  await expect(page.locator("#title-input-overlay input")).toBeVisible();
  await page.locator("#title-input-overlay input").click();
}

test("TitleScene creates, continues, renames, and deletes save slots", async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await waitForTitleScreen(page, "menu", "NEW GAME");

  await openNewGameDialog(page);
  await page.locator("#title-input-overlay input").fill("Review Run");
  await page.keyboard.press("Enter");
  await waitForGrid(page, [4, 7], "bridge");

  let index = await getSaveIndex(page);
  expect(index.slots).toHaveLength(1);
  expect(index.slots[0].name).toBe("Review Run");

  await page.reload();
  await waitForTitleScreen(page, "menu", "CONTINUE");
  await pressTitleKey(page, "ArrowDown");
  await waitForTitleScreen(page, "menu", /MANAGE SAVES/);
  await pressTitleKey(page, "ArrowDown");
  await waitForTitleScreen(page, "menu", /DELETE ALL SAVES/);
  await pressTitleKey(page, "Enter");
  await expect(page.locator("#title-input-overlay input")).toBeVisible();
  await page.locator("#title-input-overlay input").fill("DELETE");
  await page.keyboard.press("Enter");
  await waitForTitleScreen(page, "menu", "NEW GAME");
  index = await getSaveIndex(page);
  expect(index.slots).toHaveLength(0);
  expect(index.activeId).toBeNull();

  await page.reload();
  await waitForTitleScreen(page, "menu", "NEW GAME");
});

test("TitleScene can save and quit back to the title screen", async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await waitForTitleScreen(page, "menu", "NEW GAME");
  await openNewGameDialog(page);
  await page.locator("#title-input-overlay input").fill("Quitting Run");
  await page.keyboard.press("Enter");
  await waitForGrid(page, [4, 7], "bridge");

  await page.reload();
  await waitForGrid(page, [4, 7], "bridge");
  await page.getByRole("button", { name: "Home" }).first().click().catch(() => {});
});

test("TitleScene can open flash-card review from an existing save", async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await waitForTitleScreen(page, "menu", "NEW GAME");
  await pressTitleKey(page, "Enter");
  await expect(page.locator("#title-input-overlay input")).toBeVisible();
  await page.locator("#title-input-overlay input").fill("Review Run");
  await page.keyboard.press("Enter");
  await waitForGrid(page, [4, 7], "bridge");
  await page.evaluate(() => {
    const app = window.__tmuxTrekApp;
    app.state.restoreUnlockedCommands(["tmux"]);
    app.saveProgress();
  });
  await page.reload();
  await waitForTitleScreen(page, "menu", "CONTINUE");
  await pressTitleKey(page, "ArrowDown");
  await waitForTitleScreen(page, "menu", "REVIEW COMMANDS");
  await pressTitleKey(page, "Enter");
  await waitForGrid(page, [4, 7], "bridge");
  await expect(page.locator("#review-root")).toHaveAttribute(
    "data-review-mode",
    "flashcards",
  );
  await expect(page.locator("#review-root")).toContainText(
    "What command turns the Rift terminal into a live route?",
  );
});
