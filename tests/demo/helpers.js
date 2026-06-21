import { expect } from "@playwright/test";

export const GRID_TIMEOUT = 15_000;

// ── Navigation ────────────────────────────────────────────────────────────────

export async function waitForGrid(page, grid, zoneId) {
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-player-grid",
    `${grid[0]},${grid[1]}`,
    { timeout: GRID_TIMEOUT },
  );
  if (zoneId) {
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-zone-id",
      zoneId,
    );
  }
}

export async function pressMove(page, key, expectedGrid) {
  await page.locator("#game-root").focus();
  await page.keyboard.press(key);
  await expect
    .poll(() => page.locator("#game-root").getAttribute("data-player-grid"), {
      timeout: GRID_TIMEOUT,
    })
    .toBe(`${expectedGrid[0]},${expectedGrid[1]}`);
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-is-moving",
    "false",
  );
}

export async function moveAlong(page, sequence) {
  for (const [key, expected] of sequence) {
    await pressMove(page, key, expected);
  }
}

// ── Interaction ───────────────────────────────────────────────────────────────

export async function openDialogue(page) {
  await page.keyboard.press("KeyE");
  await expect(page.locator("#dialogue-root")).not.toHaveClass(/hidden/);
}

export async function clearDialogue(page) {
  const root = page.locator("#dialogue-root");
  while (!((await root.getAttribute("class")) ?? "").includes("hidden")) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
  }
}

export async function pressTmuxKeybinding(page, key) {
  await page.keyboard.press("Control+b");
  await page.keyboard.type(key);
}

// ── Demo caption ──────────────────────────────────────────────────────────────

export async function setCaption(page, text) {
  await page.evaluate((t) => window.__demoSetCaption?.(t), text);
}

// ── State injection ───────────────────────────────────────────────────────────

// Shared session shapes used in pre-injected snapshots.
const SESSION_0 = {
  name: "0",
  attached: false,
  activeWindowId: 0,
  windows: [{ id: 0, name: "main", activePaneId: 0, panes: [{ id: 0, title: "shell" }] }],
};

const SESSION_ARMORY = {
  name: "armory",
  attached: false,
  activeWindowId: 0,
  windows: [{ id: 0, name: "main", activePaneId: 0, panes: [{ id: 0, title: "shell" }] }],
};

function makeSave({
  engine,
  missionObjectiveId,
  completedObjectives,
  inventoryItems,
  score,
  unlockedCommands,
  zoneId,
}) {
  const PAST = 1_750_000_000_000;
  return {
    v: 3,
    engine,
    mission: {
      currentActId: "act-01-sessions",
      currentObjectiveId: missionObjectiveId,
      completedObjectives,
    },
    inventory: { items: inventoryItems },
    score: {
      total: score,
      byAct: { "act-01-sessions": score },
      awardedEvents: completedObjectives.map((id) => `objective:${id}`),
    },
    progress: {
      acts: {
        "act-01-sessions": {
          startedAt: PAST,
          completedAt: null,
          completedObjectiveIds: completedObjectives,
        },
      },
    },
    review: {},
    unlockedCommands,
    view: { currentZoneId: zoneId },
  };
}

// Injects a save into localStorage before the page boots (via addInitScript).
export async function injectSave(page, saveData) {
  const slotId = "demo";
  const index = JSON.stringify({
    version: 3,
    activeId: slotId,
    slots: [{ id: slotId, name: "Demo", updatedAt: 1_750_000_000_000 }],
  });
  const slot = JSON.stringify({ ...saveData });

  await page.addInitScript(
    ({ indexKey, slotKey, indexVal, slotVal }) => {
      window.localStorage.setItem(indexKey, indexVal);
      window.localStorage.setItem(slotKey, slotVal);
    },
    {
      indexKey: "tmux-trek:saves",
      slotKey: `tmux-trek:save:${slotId}`,
      indexVal: index,
      slotVal: slot,
    },
  );
}

// Pre-built snapshots for each clip that needs mid-game state ─────────────────

export const SAVE_AT_SURFACE = makeSave({
  engine: { sessions: [{ ...SESSION_0, attached: true }], activeSessionName: "0", nextUnnamedSession: 1 },
  missionObjectiveId: "collect-rift-code",
  completedObjectives: ["activate-rift-terminal"],
  inventoryItems: [],
  score: 100,
  unlockedCommands: ["tmux"],
  zoneId: "surface",
});

export const SAVE_AT_OPEN_ARMORY = makeSave({
  engine: { sessions: [{ ...SESSION_0, attached: true }], activeSessionName: "0", nextUnnamedSession: 1 },
  missionObjectiveId: "open-armory",
  completedObjectives: ["activate-rift-terminal", "collect-rift-code"],
  inventoryItems: ["RIFT_CODE"],
  score: 200,
  unlockedCommands: ["tmux"],
  zoneId: "surface",
});

export const SAVE_AT_RETURN_TO_BRIDGE = makeSave({
  engine: {
    sessions: [SESSION_0, { ...SESSION_ARMORY, attached: true }],
    activeSessionName: "armory",
    nextUnnamedSession: 1,
  },
  missionObjectiveId: "return-to-bridge",
  completedObjectives: ["activate-rift-terminal", "collect-rift-code", "open-armory", "retrieve-weapon"],
  inventoryItems: ["RIFT_CODE", "ARMORY_WEAPON"],
  score: 400,
  unlockedCommands: ["tmux", "tmux new -s armory"],
  zoneId: "armory",
});

export const SAVE_AT_CLEAR_OVERFLOW = makeSave({
  engine: {
    sessions: [{ ...SESSION_0, attached: true }, SESSION_ARMORY],
    activeSessionName: "0",
    nextUnnamedSession: 1,
  },
  missionObjectiveId: "clear-overflow",
  completedObjectives: [
    "activate-rift-terminal",
    "collect-rift-code",
    "open-armory",
    "retrieve-weapon",
    "return-to-bridge",
    "inspect-manifest",
    "reattach-surface",
  ],
  inventoryItems: ["RIFT_CODE", "ARMORY_WEAPON"],
  score: 700,
  unlockedCommands: ["tmux", "tmux new -s armory", "Ctrl+b d", "tmux ls", "tmux attach -t 0"],
  zoneId: "surface",
});
