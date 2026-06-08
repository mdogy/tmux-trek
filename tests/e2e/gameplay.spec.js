import { expect, test } from "@playwright/test";

async function readGrid(page) {
  const value = await page
    .locator("#game-root")
    .getAttribute("data-player-grid");
  return value.split(",").map(Number);
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

async function pressBlockedMove(page, key, expectedGrid) {
  await page.locator("#game-root").focus();
  await page.keyboard.press(key);
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-player-grid",
    `${expectedGrid[0]},${expectedGrid[1]}`,
  );
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-last-move-result",
    "blocked",
  );
}

async function moveAlong(page, sequence) {
  for (const [key, expected] of sequence) {
    await pressMove(page, key, expected);
  }
}

async function advanceDialogue(page, expectedSpeaker) {
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);
  await expect(page.locator("#dialogue-root")).toHaveAttribute(
    "data-speaker",
    expectedSpeaker,
  );
  await page.keyboard.press("Enter");
}

async function openConversation(page, expectedSpeaker) {
  await page.keyboard.press("KeyE");
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);
  await expect(page.locator("#dialogue-root")).toHaveAttribute(
    "data-speaker",
    expectedSpeaker,
  );
}

async function completeZrixChallenge(page) {
  await openConversation(page, "Zrix");
  await page.keyboard.press("Enter");
  await expect(page.locator("#dialogue-root")).toHaveAttribute(
    "data-speaker",
    "HELIX",
  );
  await page.keyboard.press("Enter");

  await expect(page.locator("#terminal-root")).not.toHaveClass(/hidden/);
  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "session-init",
  );

  await page.keyboard.type("tmux");
  await page.keyboard.press("Enter");
  await expect(page.locator("#codex-list")).toContainText("tmux");

  await page.keyboard.type("tmux new -s clulix");
  await page.keyboard.press("Enter");
  await expect(page.locator("#codex-list")).toContainText("tmux new -s clulix");
  await expect(page.locator("#terminal-root")).toHaveClass(/hidden/);
  await expect(page.locator("#mission-text")).toContainText("Vrex");
}

async function startChallenge(page, speaker, challengeId) {
  await openConversation(page, speaker);
  await page.keyboard.press("Enter");
  await expect(page.locator("#dialogue-root")).toHaveAttribute(
    "data-speaker",
    "HELIX",
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    challengeId,
  );
}

async function pressTmuxKeybinding(page, key) {
  await page.keyboard.press("Control+b");
  await page.keyboard.type(key);
}

test.describe("TMUX Trek world input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-player-grid",
      "17,12",
      { timeout: 10_000 },
    );
  });

  test("captain starts beside the beacon, not in an arbitrary board position", async ({
    page,
  }) => {
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-player-grid",
      "17,12",
    );
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /CLULIX beacon/,
    );
  });

  test("place tiles block movement", async ({ page }) => {
    await pressBlockedMove(page, "KeyD", [17, 12]);
  });

  test("WASD sequence keeps movement responsive without freezing", async ({
    page,
  }) => {
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

  test("active NPC interaction requires horizontal adjacency and highlights the target", async ({
    page,
  }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyW", [17, 4]],
      ["KeyW", [17, 3]],
      ["KeyA", [16, 3]],
      ["KeyA", [15, 3]],
      ["KeyA", [14, 3]],
      ["KeyA", [13, 3]],
      ["KeyA", [12, 3]],
      ["KeyA", [11, 3]],
      ["KeyA", [10, 3]],
      ["KeyA", [9, 3]],
      ["KeyA", [8, 3]],
      ["KeyA", [7, 3]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-nearby-npc",
      "zrix",
    );
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-highlighted-target",
      "zrix",
    );
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Zrix/,
    );
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-player-grid",
      "7,3",
    );
  });

  test("occupied character tiles block movement", async ({ page }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyW", [17, 4]],
      ["KeyW", [17, 3]],
      ["KeyA", [16, 3]],
      ["KeyA", [15, 3]],
      ["KeyA", [14, 3]],
      ["KeyA", [13, 3]],
      ["KeyA", [12, 3]],
      ["KeyA", [11, 3]],
      ["KeyA", [10, 3]],
      ["KeyA", [9, 3]],
      ["KeyA", [8, 3]],
      ["KeyA", [7, 3]],
    ]);

    await pressBlockedMove(page, "KeyA", [7, 3]);
  });

  test("wrong adjacent character has nothing to say yet", async ({ page }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyW", [17, 4]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-highlighted-target",
      "orin",
    );
    await page.keyboard.press("KeyE");
    await expect(page.locator("#dialogue-root")).toHaveClass(/hidden/);
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-last-interaction-result",
      "nothing",
    );
    await expect(page.locator("#instruction-text")).toContainText(
      "Archivist Orin has nothing to say yet",
    );
  });

  test("standing above or below a character does not enable interaction", async ({
    page,
  }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyA", [16, 5]],
      ["KeyA", [15, 5]],
      ["KeyA", [14, 5]],
      ["KeyA", [13, 5]],
      ["KeyA", [12, 5]],
      ["KeyA", [11, 5]],
      ["KeyA", [10, 5]],
      ["KeyA", [9, 5]],
      ["KeyA", [8, 5]],
      ["KeyA", [7, 5]],
      ["KeyA", [6, 5]],
      ["KeyW", [6, 4]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-highlighted-target",
      "",
    );
    await page.keyboard.press("KeyE");
    await expect(page.locator("#dialogue-root")).toHaveClass(/hidden/);
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-last-interaction-result",
      "none",
    );
  });

  test("obstacle tiles block movement", async ({ page }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyA", [16, 8]],
      ["KeyA", [15, 8]],
      ["KeyA", [14, 8]],
    ]);

    await pressBlockedMove(page, "KeyS", [14, 8]);
  });

  test("interaction does not remain queued after pressing E away from the active NPC", async ({
    page,
  }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyW", [17, 4]],
      ["KeyW", [17, 3]],
      ["KeyA", [16, 3]],
    ]);

    await page.keyboard.press("KeyE");
    await page.waitForTimeout(100);
    await pressMove(page, "KeyA", [15, 3]);

    await expect(page.locator("#dialogue-root")).toHaveClass(/hidden/);
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Stand immediately left or right of Zrix/,
    );
  });

  test("keyboard-only acceptance flow reaches and opens Vrex after Zrix lesson", async ({
    page,
  }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyW", [17, 4]],
      ["KeyW", [17, 3]],
      ["KeyA", [16, 3]],
      ["KeyA", [15, 3]],
      ["KeyA", [14, 3]],
      ["KeyA", [13, 3]],
      ["KeyA", [12, 3]],
      ["KeyA", [11, 3]],
      ["KeyA", [10, 3]],
      ["KeyA", [9, 3]],
      ["KeyA", [8, 3]],
      ["KeyA", [7, 3]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Zrix/,
    );
    await completeZrixChallenge(page);

    await moveAlong(page, [
      ["KeyD", [8, 3]],
      ["KeyD", [9, 3]],
      ["KeyD", [10, 3]],
      ["KeyD", [11, 3]],
      ["KeyS", [11, 4]],
      ["KeyS", [11, 5]],
      ["KeyS", [11, 6]],
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Vrex/,
    );
    await openConversation(page, "Vrex");
    await advanceDialogue(page, "Vrex");
    await expect(page.locator("#dialogue-root")).toHaveAttribute(
      "data-speaker",
      "HELIX",
    );
    await page.keyboard.press("Enter");
    await expect(page.locator("#terminal-root")).toHaveAttribute(
      "data-active-challenge",
      "detach-drill",
    );
  });

  test("keyboard-only progression completes Act 2 and Act 3", async ({
    page,
  }) => {
    await moveAlong(page, [
      ["KeyW", [17, 11]],
      ["KeyW", [17, 10]],
      ["KeyW", [17, 9]],
      ["KeyW", [17, 8]],
      ["KeyW", [17, 7]],
      ["KeyW", [17, 6]],
      ["KeyW", [17, 5]],
      ["KeyW", [17, 4]],
      ["KeyW", [17, 3]],
      ["KeyA", [16, 3]],
      ["KeyA", [15, 3]],
      ["KeyA", [14, 3]],
      ["KeyA", [13, 3]],
      ["KeyA", [12, 3]],
      ["KeyA", [11, 3]],
      ["KeyA", [10, 3]],
      ["KeyA", [9, 3]],
      ["KeyA", [8, 3]],
      ["KeyA", [7, 3]],
    ]);
    await completeZrixChallenge(page);

    await moveAlong(page, [
      ["KeyD", [8, 3]],
      ["KeyD", [9, 3]],
      ["KeyD", [10, 3]],
      ["KeyD", [11, 3]],
      ["KeyS", [11, 4]],
      ["KeyS", [11, 5]],
      ["KeyS", [11, 6]],
    ]);
    await startChallenge(page, "Vrex", "detach-drill");
    await pressTmuxKeybinding(page, "d");
    await expect(page.locator("#mission-text")).toContainText("Archivist Orin");

    await moveAlong(page, [
      ["KeyW", [11, 5]],
      ["KeyW", [11, 4]],
      ["KeyD", [12, 4]],
      ["KeyD", [13, 4]],
      ["KeyD", [14, 4]],
      ["KeyD", [15, 4]],
    ]);
    await startChallenge(page, "Archivist Orin", "return-to-rift");
    await page.keyboard.type("tmux ls");
    await page.keyboard.press("Enter");
    await page.keyboard.type("tmux attach -t clulix");
    await page.keyboard.press("Enter");
    await expect(page.locator("#mission-text")).toContainText(
      "Ensign Redshirt",
    );

    await moveAlong(page, [
      ["KeyA", [14, 4]],
      ["KeyA", [13, 4]],
      ["KeyA", [12, 4]],
      ["KeyA", [11, 4]],
      ["KeyA", [10, 4]],
      ["KeyA", [9, 4]],
      ["KeyA", [8, 4]],
      ["KeyA", [7, 4]],
      ["KeyS", [7, 5]],
      ["KeyS", [7, 6]],
      ["KeyS", [7, 7]],
      ["KeyS", [7, 8]],
      ["KeyS", [7, 9]],
      ["KeyS", [7, 10]],
      ["KeyS", [7, 11]],
    ]);
    await startChallenge(page, "Ensign Redshirt", "redshirt-window-rescue");
    await pressTmuxKeybinding(page, "c");
    await pressTmuxKeybinding(page, "w");
    await pressTmuxKeybinding(page, "p");
    await expect(page.locator("#mission-text")).toContainText("Commander Sock");

    await moveAlong(page, [
      ["KeyD", [8, 11]],
      ["KeyD", [9, 11]],
      ["KeyD", [10, 11]],
      ["KeyD", [11, 11]],
    ]);
    await startChallenge(page, "Commander Sock", "sock-pane-scanner");
    await pressTmuxKeybinding(page, "%");
    await pressTmuxKeybinding(page, '"');
    await pressTmuxKeybinding(page, "x");

    await expect(page.locator("#mission-text")).toContainText(
      "Return to the CLULIX beacon",
    );
  });
});
