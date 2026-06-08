import { expect, test } from "@playwright/test";

async function readGrid(page) {
  const value = await page
    .locator("#game-root")
    .getAttribute("data-player-grid");
  return value.split(",").map(Number);
}

async function pressMove(page, key, expectedGrid) {
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

  test("active NPC interaction triggers by proximity before overlap", async ({
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
      ["KeyD", [18, 5]],
      ["KeyA", [17, 5]],
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
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-nearby-npc",
      "zrix",
    );
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Zrix/,
    );
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-player-grid",
      "6,5",
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
      ["KeyA", [16, 5]],
      ["KeyA", [15, 5]],
      ["KeyA", [14, 5]],
      ["KeyA", [13, 5]],
      ["KeyA", [12, 5]],
      ["KeyA", [11, 5]],
      ["KeyA", [10, 5]],
      ["KeyA", [9, 5]],
    ]);

    await page.keyboard.press("KeyE");
    await page.waitForTimeout(100);
    await pressMove(page, "KeyA", [8, 5]);

    await expect(page.locator("#dialogue-root")).toHaveClass(/hidden/);
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Zrix/,
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
    ]);

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-prompt",
      /Press E to talk to Zrix/,
    );
    await completeZrixChallenge(page);

    await moveAlong(page, [
      ["KeyD", [7, 5]],
      ["KeyD", [8, 5]],
      ["KeyD", [9, 5]],
      ["KeyD", [10, 5]],
      ["KeyS", [10, 6]],
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
});
