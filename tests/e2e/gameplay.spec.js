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

test.describe("TMUX Trek world input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#game-root canvas").click();
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
});
