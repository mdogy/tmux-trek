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
    ["KeyD", [10, 9]],
  ]);

  await setCaption(page, "Mission: Open the Rift terminal and descend to the surface");
  await page.waitForTimeout(4_000);
});

// ── Clip 03: Open Rift terminal — type tmux ──────────────────────────────────

test("03 - open rift terminal", async ({ page }) => {
  await page.goto("/?testMode=1&demo=1&useV2Zones=1");
  await waitForGrid(page, [7, 9], "bridge");

  // Walk into interaction range of the right-side Rift terminal.
  await moveAlong(page, [
    ["KeyD", [8, 9]],
    ["KeyD", [9, 9]],
    ["KeyD", [10, 9]],
    ["KeyD", [11, 9]],
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
  await waitForGrid(page, [1, 15], "surface");

  await setCaption(page, "The surface zone — explore to find the Rift Code");
  await page.waitForTimeout(2_000);

  // Walk a few steps toward Zrix to show the zone
  await moveAlong(page, [
    ["KeyD", [2, 15]],
    ["KeyD", [3, 15]],
    ["KeyD", [4, 15]],
  ]);

  await setCaption(page, "Each zone is only reachable via the right tmux command");
  await page.waitForTimeout(4_500);
});

// ── Clip 05: Named session — tmux new -s armory ───────────────────────────────

test("05 - named session armory", async ({ page }) => {
  await injectSave(page, SAVE_AT_OPEN_ARMORY);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [1, 15], "surface");

  await setCaption(page, "Rift Code in hand — return to Zrix to open the armory");
  await page.waitForTimeout(1_500);

  // Navigate to Zrix's relay-shed work area.
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

  await setCaption(page, "`tmux new -s armory` — create a named session");
  await page.waitForTimeout(1_200);
  await page.keyboard.type("tmux new -s armory");
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");

  await waitForGrid(page, [7, 10], "armory");
  await setCaption(page, "A new zone — only reachable via this exact session name");
  await page.waitForTimeout(4_500);
});

// ── Clip 06: Keybinding — Ctrl+b d ───────────────────────────────────────────

test("06 - detach keybinding", async ({ page }) => {
  await injectSave(page, SAVE_AT_RETURN_TO_BRIDGE);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [7, 10], "armory");

  await setCaption(page, "Weapon retrieved — time to detach and return to the bridge");
  await page.waitForTimeout(1_500);

  // Walk to Armorer Kesh's forge station.
  await moveAlong(page, [
    ["KeyD", [8, 10]],
    ["KeyW", [8, 9]],
    ["KeyW", [8, 8]],
    ["KeyW", [8, 7]],
    ["KeyW", [8, 6]],
    ["KeyA", [7, 6]],
    ["KeyA", [6, 6]],
    ["KeyA", [5, 6]],
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

  await waitForGrid(page, [7, 9], "bridge");
  await setCaption(page, "Detached — back on the bridge. Session `armory` still lives.");
  await page.waitForTimeout(4_500);
});

// ── Clip 07: Act complete + readiness gate ────────────────────────────────────

test("07 - act complete", async ({ page }) => {
  await injectSave(page, SAVE_AT_CLEAR_OVERFLOW);
  await page.goto("/?testMode=1&demo=1");
  await waitForGrid(page, [1, 15], "surface");

  await setCaption(page, "Final objective: clear the overflow buffer blocking Starfall Village");
  await page.waitForTimeout(1_500);

  // Navigate to the overflow front.
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
