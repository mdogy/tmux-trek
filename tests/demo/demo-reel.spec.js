/**
 * Demo reel — 7 highlight clips recorded sequentially.
 *
 * Run via: npx playwright test --config=playwright.demo.config.js
 * Or:       make demo-clips
 *
 * After recording, assemble the reel with: python3 scripts/demo-reel.py
 * Or:                                       make demo-reel
 *
 * Each test drives to a specific highlight moment, then pauses so the viewer
 * can read the on-screen result. The Python reel script trims the last N
 * seconds from each clip (defined in scripts/demo-manifest.json) and
 * concatenates them into test-results/demo/reel.mp4.
 */

import { test, expect } from "@playwright/test";
import {
  clearDialogue,
  injectSave,
  moveAlong,
  openDialogue,
  pressTmuxKeybinding,
  SAVE_AT_CLEAR_OVERFLOW,
  SAVE_AT_OPEN_ARMORY,
  SAVE_AT_RETURN_TO_BRIDGE,
  SAVE_AT_SURFACE,
  setCaption,
  waitForGrid,
} from "./helpers.js";

// ── Clip 01: Title screen ─────────────────────────────────────────────────────

test("01 - title screen", async ({ page }) => {
  await page.goto("/?demo=1&useV2Zones=1");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });

  await setCaption(page, "TMUX Trek — learn terminal multiplexing through play");
  await page.waitForTimeout(6_000);
});

// ── Clip 02: Bridge — first mission ──────────────────────────────────────────

test("02 - bridge first mission", async ({ page }) => {
  await page.goto("/?testMode=1&demo=1&useV2Zones=1");
  await waitForGrid(page, [7, 9], "bridge");

  await setCaption(page, "Act 1: First Descent — the CLULIX Bridge");
  await page.waitForTimeout(2_500);

  // Walk toward the Rift terminal so the viewer sees movement and the HUD
  await moveAlong(page, [
    ["KeyD", [8, 9]],
    ["KeyD", [9, 9]],
    ["KeyW", [9, 8]],
  ]);

  await setCaption(page, "Mission: Open the Rift terminal and descend to the surface");
  await page.waitForTimeout(4_000);
});

// ── Clip 03: Open Rift terminal — type tmux ──────────────────────────────────

test("03 - open rift terminal", async ({ page }) => {
  await page.goto("/?testMode=1&demo=1&useV2Zones=1");
  await waitForGrid(page, [7, 9], "bridge");

  // Walk to the tile adjacent to the rift-terminal at [8,7] — [7,7] is the
  // interaction range; [8,7] itself is blocked by the terminal sprite.
  await moveAlong(page, [
    ["KeyD", [8, 9]],
    ["KeyD", [9, 9]],
    ["KeyW", [9, 8]],
  ]);

  await setCaption(page, "Press E to activate the Rift terminal...");
  await openDialogue(page);
  await clearDialogue(page);

  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "bridge-open-rift",
  );

  await setCaption(page, "Type `tmux` to open your first session");
  await page.waitForTimeout(1_500);
  await page.keyboard.type("tmux");
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter");

  await waitForGrid(page, [1, 15], "surface");
  await setCaption(page, "The Rift opens — a new zone unlocked");
  await page.waitForTimeout(4_500);
});

// ── Clip 04: Surface zone arrival ─────────────────────────────────────────────

test("04 - surface zone", async ({ page }) => {
  await injectSave(page, SAVE_AT_SURFACE);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [3, 15], "surface");

  await setCaption(page, "The surface zone — explore to find the Rift Code");
  await page.waitForTimeout(2_000);

  // Walk a few steps toward Zrix to show the zone
  await moveAlong(page, [
    ["KeyD", [4, 15]],
    ["KeyD", [5, 15]],
    ["KeyD", [6, 15]],
  ]);

  await setCaption(page, "Each zone is only reachable via the right tmux command");
  await page.waitForTimeout(4_500);
});

// ── Clip 05: Named session — tmux new -s armory ───────────────────────────────

test("05 - named session armory", async ({ page }) => {
  await injectSave(page, SAVE_AT_OPEN_ARMORY);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [3, 15], "surface");

  await setCaption(page, "Rift Code in hand — return to Zrix to open the armory");
  await page.waitForTimeout(1_500);

  // Navigate to Zrix dialogue trigger at [8,15]
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

  await setCaption(page, "`tmux new -s armory` — create a named session");
  await page.waitForTimeout(1_200);
  await page.keyboard.type("tmux new -s armory");
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");

  await waitForGrid(page, [3, 7], "armory");
  await setCaption(page, "A new zone — only reachable via this exact session name");
  await page.waitForTimeout(4_500);
});

// ── Clip 06: Keybinding — Ctrl+b d ───────────────────────────────────────────

test("06 - detach keybinding", async ({ page }) => {
  await injectSave(page, SAVE_AT_RETURN_TO_BRIDGE);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [3, 7], "armory");

  await setCaption(page, "Weapon retrieved — time to detach and return to the bridge");
  await page.waitForTimeout(1_500);

  // Walk to armorer at [14,7]
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

  await openDialogue(page);
  await clearDialogue(page);

  await expect(page.locator("#terminal-root")).toHaveAttribute(
    "data-active-challenge",
    "armory-detach",
  );

  await setCaption(page, "Ctrl+b d — detach and leave sessions running in the background");
  await page.waitForTimeout(1_500);
  await pressTmuxKeybinding(page, "d");

  await waitForGrid(page, [4, 7], "bridge");
  await setCaption(page, "Detached — back on the bridge. Session `armory` still lives.");
  await page.waitForTimeout(4_500);
});

// ── Clip 07: Act complete + readiness gate ────────────────────────────────────

test("07 - act complete", async ({ page }) => {
  await injectSave(page, SAVE_AT_CLEAR_OVERFLOW);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [3, 15], "surface");

  await setCaption(page, "Final objective: clear the overflow buffer blocking Starfall Village");
  await page.waitForTimeout(1_500);

  // Navigate to overflow at [23,15] — same path as the E2E gameplay test
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

  await setCaption(page, "Fire the bracket cannon — press E to clear the overflow");
  await page.waitForTimeout(800);
  await page.keyboard.press("KeyE");

  await expect(page.locator("#completion-root")).toHaveAttribute(
    "data-act-complete",
    "true",
  );
  await expect(page.locator("#score-total")).toContainText("Score: 1050");

  await setCaption(page, "First Descent complete — 1050 points earned  ·  HELIX readiness check unlocked");
  await page.waitForTimeout(6_000);
});
