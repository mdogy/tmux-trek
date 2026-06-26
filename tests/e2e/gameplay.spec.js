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
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("tmux-trek:test-storage-cleared")) {
      window.localStorage.clear();
      window.sessionStorage.setItem("tmux-trek:test-storage-cleared", "1");
    }
  });
  await page.goto("/?testMode=1");
  await waitForGrid(page, [7, 9], "bridge");
  await expect(page.locator("#mission-text")).toContainText(
    "Open the Rift terminal",
  );
  await expect(page.locator("#score-total")).toContainText("Score: 0");
  await expect(page.locator("#progress-text")).toContainText(
    "First Descent: 0/8 objectives",
  );

  await moveAlong(page, [
    ["KeyD", [8, 9]],
    ["KeyD", [9, 9]],
    ["KeyD", [10, 9]],
    ["KeyD", [11, 9]],
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
  await waitForGrid(page, [1, 15], "surface");
  await expect(page.locator("#mission-text")).toContainText(
    "Find the Rift Code",
  );
  await expect(page.locator("#score-total")).toContainText("Score: 100");

  await moveAlong(page, [
    ["KeyD", [2, 15]],
    ["KeyD", [3, 15]],
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
    ["KeyD", [7, 15]],
    ["KeyD", [8, 15]],
    ["KeyD", [9, 15]],
    ["KeyD", [10, 15]],
    ["KeyD", [11, 15]],
    ["KeyD", [12, 15]],
    ["KeyD", [13, 15]],
    ["KeyD", [14, 15]],
    ["KeyD", [15, 15]],
    ["KeyD", [16, 15]],
    ["KeyD", [17, 15]],
    ["KeyS", [17, 16]],
    ["KeyS", [17, 17]],
    ["KeyD", [18, 17]],
    ["KeyD", [19, 17]],
    ["KeyD", [20, 17]],
    ["KeyD", [21, 17]],
    ["KeyS", [21, 18]],
    ["KeyD", [22, 18]],
    ["KeyD", [23, 18]],
    ["KeyD", [24, 18]],
    ["KeyD", [25, 18]],
    ["KeyD", [26, 18]],
    ["KeyD", [27, 18]],
    ["KeyD", [28, 18]],
    ["KeyD", [29, 18]],
    ["KeyD", [30, 18]],
    ["KeyD", [31, 18]],
    ["KeyD", [32, 18]],
    ["KeyS", [32, 19]],
    ["KeyS", [32, 20]],
    ["KeyS", [32, 21]],
    ["KeyD", [33, 21]],
    ["KeyS", [33, 22]],
  ]);

  await expect(page.locator("#instruction-text")).toContainText(
    "Return to Zrix and open the armory session",
  );
  await expect(page.locator("#codex-list")).toContainText("tmux new -s armory");
  await page.getByRole("button", { name: "Review Commands" }).click();
  await expect(page.locator("#review-root")).toHaveAttribute(
    "data-review-mode",
    "flashcards",
  );
  await expect(page.locator("#review-root")).toContainText(
    "What command turns the Rift terminal into a live route?",
  );
  await page.getByRole("button", { name: "Flip Card" }).click();
  await expect(page.locator("#review-root")).toContainText("tmux");
  await page.getByRole("button", { name: "Got It" }).click();
  await expect(page.locator("#review-root")).toHaveAttribute(
    "data-review-card",
    "tmux new -s armory",
  );
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#review-root")).toHaveClass(/hidden/);

  await page.reload();
  await waitForGrid(page, [1, 15], "surface");
  await expect(page.locator("#instruction-text")).toContainText(
    "Return to Zrix",
  );

  await moveAlong(page, [
    ["KeyD", [2, 15]],
    ["KeyD", [3, 15]],
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
    ["KeyD", [7, 15]],
    ["KeyD", [8, 15]],
    ["KeyD", [9, 15]],
    ["KeyD", [10, 15]],
    ["KeyD", [11, 15]],
    ["KeyD", [12, 15]],
    ["KeyD", [13, 15]],
    ["KeyD", [14, 15]],
    ["KeyD", [15, 15]],
    ["KeyD", [16, 15]],
    ["KeyD", [17, 15]],
    ["KeyS", [17, 16]],
    ["KeyS", [17, 17]],
    ["KeyD", [18, 17]],
    ["KeyD", [19, 17]],
    ["KeyD", [20, 17]],
    ["KeyD", [21, 17]],
    ["KeyS", [21, 18]],
    ["KeyD", [22, 18]],
    ["KeyD", [23, 18]],
    ["KeyD", [24, 18]],
    ["KeyD", [25, 18]],
    ["KeyD", [26, 18]],
    ["KeyD", [27, 18]],
    ["KeyD", [28, 18]],
    ["KeyD", [29, 18]],
    ["KeyD", [30, 18]],
    ["KeyD", [31, 18]],
    ["KeyD", [32, 18]],
    ["KeyS", [32, 19]],
    ["KeyS", [32, 20]],
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
  await waitForGrid(page, [7, 10], "armory");

  await moveAlong(page, [
    ["KeyW", [7, 9]],
    ["KeyW", [7, 8]],
    ["KeyW", [7, 7]],
    ["KeyW", [7, 6]],
    ["KeyD", [8, 6]],
    ["KeyA", [7, 6]],
    ["KeyA", [6, 6]],
    ["KeyA", [5, 6]],
    ["KeyW", [5, 5]],
    ["KeyW", [5, 4]],
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
  await waitForGrid(page, [7, 9], "bridge");

  await moveAlong(page, [
    ["KeyD", [8, 9]],
    ["KeyD", [9, 9]],
    ["KeyD", [10, 9]],
    ["KeyD", [11, 9]],
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
  await waitForGrid(page, [1, 15], "surface");

  await moveAlong(page, [
    ["KeyD", [2, 15]],
    ["KeyD", [3, 15]],
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
    ["KeyD", [7, 15]],
    ["KeyD", [8, 15]],
    ["KeyD", [9, 15]],
    ["KeyD", [10, 15]],
    ["KeyD", [11, 15]],
    ["KeyD", [12, 15]],
    ["KeyD", [13, 15]],
    ["KeyD", [14, 15]],
    ["KeyD", [15, 15]],
    ["KeyD", [16, 15]],
    ["KeyD", [17, 15]],
    ["KeyD", [18, 15]],
    ["KeyW", [18, 14]],
    ["KeyD", [19, 14]],
    ["KeyD", [20, 14]],
    ["KeyD", [21, 14]],
    ["KeyD", [22, 14]],
    ["KeyD", [23, 14]],
    ["KeyD", [24, 14]],
    ["KeyD", [25, 14]],
    ["KeyD", [26, 14]],
    ["KeyD", [27, 14]],
    ["KeyD", [28, 14]],
    ["KeyD", [29, 14]],
    ["KeyD", [30, 14]],
    ["KeyD", [31, 14]],
    ["KeyD", [32, 14]],
    ["KeyD", [33, 14]],
    ["KeyD", [34, 14]],
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
  await expect(page.locator("#score-total")).toContainText("Score: 1050");
  await expect(page.locator("#progress-text")).toContainText(
    "First Descent: 8/8 objectives, 1/1 acts complete",
  );
  await expect(page.locator("#completion-root")).toHaveAttribute(
    "data-act-complete",
    "true",
  );
  await expect(page.locator("#completion-root")).toContainText(
    "First Descent complete",
  );
  await expect(
    page.getByRole("button", { name: "Start Readiness Check" }),
  ).toBeVisible();

  await page.reload();
  await waitForGrid(page, [1, 15], "surface");
  await expect(page.locator("#completion-root")).toHaveAttribute(
    "data-act-complete",
    "true",
  );

  await page.getByRole("button", { name: "Start Readiness Check" }).click();
  await expect(page.locator("#review-root")).toHaveAttribute(
    "data-review-mode",
    "gate",
  );
  await expect(page.locator("#review-root")).toHaveAttribute(
    "data-review-question",
    "start-rift",
  );
  const review = page.locator("#review-root");
  await review.getByRole("button", { name: "tmux", exact: true }).click();
  await review.getByRole("button", { name: "Next", exact: true }).click();
  await review
    .getByRole("button", { name: "tmux new -s armory", exact: true })
    .click();
  await review.getByRole("button", { name: "Next", exact: true }).click();
  await review.getByRole("button", { name: "Ctrl+b d", exact: true }).click();
  await review.getByRole("button", { name: "Next", exact: true }).click();
  await review.getByRole("button", { name: "tmux ls", exact: true }).click();
  await review.getByRole("button", { name: "Next", exact: true }).click();
  await review
    .getByRole("button", { name: "tmux attach -t 0", exact: true })
    .click();
  await review.getByRole("button", { name: "Submit Check", exact: true }).click();
  await expect(page.locator("#review-root")).toContainText(
    "HELIX certifies you at 100%",
  );
  await review.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("#review-root")).toHaveClass(/hidden/);

  await page.reload();
  await waitForGrid(page, [1, 15], "surface");
  await expect(page.locator("#completion-root")).toHaveClass(/hidden/);
});
