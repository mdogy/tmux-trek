import { expect, test } from "@playwright/test";

const GRID_READY_TIMEOUT = 15_000;

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

async function pressMove(page, key, expectedGrid) {
  await page.locator("#game-root").focus();
  await page.keyboard.press(key);
  await expect
    .poll(() => page.locator("#game-root").getAttribute("data-player-grid"))
    .toBe(`${expectedGrid[0]},${expectedGrid[1]}`);
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-is-moving",
    "false",
  );
}

async function moveAlong(page, sequence) {
  for (const [key, expected] of sequence) {
    await pressMove(page, key, expected);
  }
}

async function openDialogue(page) {
  await page.keyboard.press("KeyE");
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);
}

async function clearDialogue(page) {
  const root = page.locator("#dialogue-root");
  while (!((await root.getAttribute("class")) ?? "").includes("hidden")) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
  }
}

async function pressTmuxKeybinding(page, key) {
  await page.keyboard.press("Control+b");
  await page.keyboard.type(key);
}

test("TMUX Trek completes the Phase 1 vertical slice and restores on reload", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/?testMode=1");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await waitForGrid(page, [4, 7], "bridge");
  await expect(page.locator("#mission-text")).toContainText(
    "Open the Rift terminal",
  );

  await moveAlong(page, [
    ["KeyD", [5, 7]],
    ["KeyD", [6, 7]],
    ["KeyD", [7, 7]],
  ]);

  await openDialogue(page);
  await clearDialogue(page);
  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "bridge-open-rift",
  );
  await page.keyboard.type("tmux");
  await page.keyboard.press("Enter");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await waitForGrid(page, [3, 15], "surface");
  await expect(page.locator("#mission-text")).toContainText(
    "Find the Rift Code",
  );

  await moveAlong(page, [
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
    ["KeyW", [6, 14]],
    ["KeyW", [6, 13]],
    ["KeyW", [6, 12]],
    ["KeyD", [7, 12]],
    ["KeyD", [8, 12]],
    ["KeyD", [9, 12]],
    ["KeyD", [10, 12]],
    ["KeyD", [11, 12]],
    ["KeyD", [12, 12]],
    ["KeyD", [13, 12]],
    ["KeyD", [14, 12]],
    ["KeyS", [14, 13]],
    ["KeyS", [14, 14]],
    ["KeyS", [14, 15]],
  ]);

  await expect(page.locator("#instruction-text")).toContainText(
    "Return to Zrix and open the armory session",
  );
  await expect(page.locator("#codex-list")).toContainText("tmux new -s armory");

  await page.reload();
  await waitForGrid(page, [3, 15], "surface");
  await expect(page.locator("#instruction-text")).toContainText(
    "Return to Zrix",
  );

  await moveAlong(page, [
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
    ["KeyW", [6, 14]],
    ["KeyD", [7, 14]],
    ["KeyD", [8, 14]],
    ["KeyS", [8, 15]],
  ]);

  await openDialogue(page);
  await clearDialogue(page);
  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "village-open-armory",
  );
  await page.keyboard.type("tmux new -s armory");
  await page.keyboard.press("Enter");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await waitForGrid(page, [3, 7], "armory");

  await moveAlong(page, [
    ["KeyD", [4, 7]],
    ["KeyD", [5, 7]],
    ["KeyD", [6, 7]],
    ["KeyD", [7, 7]],
    ["KeyD", [8, 7]],
    ["KeyD", [9, 7]],
    ["KeyD", [10, 7]],
    ["KeyD", [11, 7]],
    ["KeyD", [12, 7]],
    ["KeyD", [13, 7]],
  ]);

  await expect(page.locator("#instruction-text")).toContainText(
    "Speak with Armorer Kesh",
  );
  await openDialogue(page);
  await clearDialogue(page);
  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "armory-detach",
  );
  await pressTmuxKeybinding(page, "d");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await waitForGrid(page, [4, 7], "bridge");

  await moveAlong(page, [
    ["KeyD", [5, 7]],
    ["KeyD", [6, 7]],
    ["KeyD", [7, 7]],
  ]);
  await openDialogue(page);
  await clearDialogue(page);
  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "bridge-manifest-return",
  );
  await page.keyboard.type("tmux ls");
  await page.keyboard.press("Enter");
  await page.keyboard.type("tmux attach -t 0");
  await page.keyboard.press("Enter");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await waitForGrid(page, [3, 15], "surface");

  await moveAlong(page, [
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
    ["KeyW", [6, 14]],
    ["KeyW", [6, 13]],
    ["KeyW", [6, 12]],
    ["KeyD", [7, 12]],
    ["KeyD", [8, 12]],
    ["KeyD", [9, 12]],
    ["KeyD", [10, 12]],
    ["KeyD", [11, 12]],
    ["KeyD", [12, 12]],
    ["KeyD", [13, 12]],
    ["KeyD", [14, 12]],
    ["KeyD", [15, 12]],
    ["KeyD", [16, 12]],
    ["KeyD", [17, 12]],
    ["KeyW", [17, 11]],
    ["KeyD", [18, 11]],
    ["KeyD", [19, 11]],
    ["KeyD", [20, 11]],
    ["KeyD", [21, 11]],
    ["KeyD", [22, 11]],
    ["KeyD", [23, 11]],
    ["KeyS", [23, 12]],
    ["KeyS", [23, 13]],
    ["KeyS", [23, 14]],
    ["KeyA", [22, 14]],
    ["KeyS", [22, 15]],
  ]);

  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-highlighted-target",
    "overflow",
  );
  await page.keyboard.press("KeyE");
  await expect(page.locator("#mission-text")).toContainText("Act 1 complete");
  await expect(page.locator("#instruction-text")).toContainText(
    "The overflow buffer collapses",
  );
});
