import { expect, test } from "@playwright/test";

async function readGrid(page) {
  const value = await page.locator("#game-root").getAttribute("data-player-grid");
  return value.split(",").map(Number);
}

async function pressMove(page, key, expectedGrid) {
  await page.keyboard.press(key);
  await expect
    .poll(() => page.locator("#game-root").getAttribute("data-player-grid"))
    .toBe(`${expectedGrid[0]},${expectedGrid[1]}`);
  await expect(page.locator("#game-root")).toHaveAttribute("data-is-moving", "false");
}

async function moveAlong(page, sequence) {
  for (const [key, expected] of sequence) {
    await pressMove(page, key, expected);
  }
}

async function advanceDialogue(page, expectedSpeaker) {
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);
  await expect(page.locator("#dialogue-root")).toHaveAttribute("data-speaker", expectedSpeaker);
  await page.keyboard.press("Enter");
}

async function openConversation(page, expectedSpeaker) {
  await page.keyboard.press("KeyE");
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);
  await expect(page.locator("#dialogue-root")).toHaveAttribute("data-speaker", expectedSpeaker);
}

async function completeZrixChallenge(page) {
  await openConversation(page, "Zrix");
  await page.keyboard.press("Enter");
  await expect(page.locator("#dialogue-root")).toHaveAttribute("data-speaker", "HELIX");
  await page.keyboard.press("Enter");

  await expect(page.locator("#terminal-root")).not.toHaveClass(/hidden/);
  await expect(page.locator("#terminal-root")).toHaveAttribute("data-active-challenge", "session-init");

  await page.keyboard.type("tmux");
  await page.keyboard.press("Enter");
  await expect(page.locator("#codex-list")).toContainText("tmux");

  await page.keyboard.type("tmux new -s clulix");
  await page.keyboard.press("Enter");
  await expect(page.locator("#codex-list")).toContainText("tmux new -s clulix");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await expect(page.locator("#mission-text")).toContainText("Vrex");
}

test.describe("TMUX Trek world input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#game-root")).toHaveAttribute("data-player-grid", /,/);
  });

  test("WASD sequence keeps movement responsive without freezing", async ({ page }) => {
    const start = await readGrid(page);
    const sequence = [
      ["KeyW", [start[0], start[1] - 1]],
      ["KeyS", [start[0], start[1]]],
      ["KeyW", [start[0], start[1] - 1]],
      ["KeyA", [start[0] - 1, start[1] - 1]],
      ["KeyD", [start[0], start[1] - 1]],
      ["KeyA", [start[0] - 1, start[1] - 1]],
      ["KeyW", [start[0] - 1, start[1] - 2]],
      ["KeyS", [start[0] - 1, start[1] - 1]],
    ];

    for (const [key, expected] of sequence) {
      await pressMove(page, key, expected);
    }

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-player-grid",
      `${start[0] - 1},${start[1] - 1}`,
    );
  });

  test("active NPC interaction triggers by proximity before overlap", async ({ page }) => {
    await pressMove(page, "KeyW", [5, 9]);
    await pressMove(page, "KeyW", [5, 8]);
    await pressMove(page, "KeyW", [5, 7]);
    await pressMove(page, "KeyW", [5, 6]);
    await pressMove(page, "KeyW", [5, 5]);

    await expect(page.locator("#game-root")).toHaveAttribute("data-nearby-npc", "zrix");
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Zrix/,
    );
    await expect(page.locator("#game-root")).toHaveAttribute("data-player-grid", "5,5");
  });

  test("keyboard-only acceptance flow reaches and opens Vrex after Zrix lesson", async ({
    page,
  }) => {
    await moveAlong(page, [
      ["KeyW", [5, 9]],
      ["KeyW", [5, 8]],
      ["KeyW", [5, 7]],
      ["KeyW", [5, 6]],
      ["KeyW", [5, 5]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute("data-prompt", /Press E to talk to Zrix/);
    await completeZrixChallenge(page);

    await moveAlong(page, [
      ["KeyD", [6, 5]],
      ["KeyD", [7, 5]],
      ["KeyD", [8, 5]],
      ["KeyD", [9, 5]],
      ["KeyD", [10, 5]],
      ["KeyS", [10, 6]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute("data-prompt", /Press E to talk to Vrex/);
    await openConversation(page, "Vrex");
    await advanceDialogue(page, "Vrex");
    await expect(page.locator("#dialogue-root")).toHaveAttribute("data-speaker", "HELIX");
    await page.keyboard.press("Enter");
    await expect(page.locator("#terminal-root")).toHaveAttribute("data-active-challenge", "detach-drill");
  });
});
