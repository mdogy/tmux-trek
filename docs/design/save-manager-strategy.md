# SaveManager: Browser Persistence Strategy

*Written June 19, 2026. Answers the gap in the redesign documents, which specify that `SaveManager.js` should exist but do not define the storage mechanism or serialization contract.*

> **Status: implemented (single-slot); multi-slot planned.** `src/game/systems/SaveManager.js` is live with `SAVE_VERSION = 2`, one `localStorage` slot covering engine state, `MissionSystem`, `InventorySystem`, unlocked commands, and current zone — the "Future layers" section below is complete and the "Implementation Checklist" is fully checked. The [Planned: Multi-Slot Saves (Phase 4)](#planned-multi-slot-saves-phase-4) section below specifies the next refactor to named, multiple saves. For current truth see [`../session-handoff.md`](../session-handoff.md).

---

## What the Redesign Documents Say

The redesign brief (now [`../archive/redesign-summary.md`](../archive/redesign-summary.md)) lists `SaveManager.js` in the recommended additions:

> `SaveManager.js` (new) — checkpoint-based save/load; serializes GameState + MissionSystem state

Phase 0, step 5 says:

> Create `src/game/systems/SaveManager.js`. Checkpoint save after each act. Save: MissionSystem state, InventorySystem state, GameState. Load on boot.

The acceptance criteria include:

> The game can be paused and resumed without losing progress.

Nothing in either redesign document specifies how the save is stored or what the serialization contract looks like.

---

## Storage Mechanism: `localStorage`

### Why localStorage, not alternatives

| Option | Verdict | Reason |
|---|---|---|
| `localStorage` | **Use this** | Synchronous, simple API, persists across tab close and browser restart, ~5–10MB quota (game state is <10KB), works on GitHub Pages with zero server |
| `sessionStorage` | No | Cleared when the tab is closed — defeats the purpose |
| Cookies | No | 4KB limit, sent over the network on every request, wrong tool for application state |
| `IndexedDB` | No | Async, complex API, designed for large binary blobs — overkill for JSON game state |
| URL hash / query | No | Limited length, exposes state in the URL, breaks sharing links |

`localStorage` is synchronous, which means save and load operations do not require async/await or error-callback patterns. The entire `SaveManager` can be implemented as four plain functions. The game state that needs persisting is small: a few session names, a list of completed challenge IDs, a list of collected items, and a current-act index. Under any realistic scenario this stays well under 50KB.

### Browser availability

`localStorage` is available in every browser that can run Phaser 4. It requires no feature detection — if the player can load the game, they have localStorage.

---

## What Needs to Be Saved

The save snapshot has three layers, matching the architecture's separation:

### 1. Engine state (`TmuxEngine` / `SessionManager`)

The `SessionManager` holds the mutable tmux model. Its internal state is:

```js
{
  sessions: Map<string, Session>,  // all session objects
  activeSessionName: string | null,
  nextUnnamedSession: number
}
```

`SessionManager` already uses `structuredClone` internally. Serializing to JSON is trivial since `Map` entries are plain objects.

Snapshot shape:
```json
{
  "sessions": [
    {
      "name": "clulix",
      "attached": false,
      "activeWindowId": 0,
      "windows": [
        { "id": 0, "name": "main", "activePaneId": 0, "panes": [{ "id": 0, "title": "shell" }] }
      ]
    }
  ],
  "activeSessionName": null,
  "nextUnnamedSession": 1
}
```

### 2. Game progression state (`TmuxTrekApp`)

Currently stored as two fields on `TmuxTrekApp`:

```js
this.currentNpcIndex     // number — which NPC is active
this.completedChallenges // Set<string> — completed challenge IDs
```

Snapshot shape:
```json
{
  "currentNpcIndex": 2,
  "completedChallenges": ["session-init", "detach-drill"]
}
```

### 3. Unlocked commands (`GameState`)

The Codex panel tracks which commands have been unlocked. This must persist so the Codex shows the right state on resume.

Snapshot shape:
```json
{
  "unlockedCommands": ["tmux", "tmux new -s clulix", "Ctrl+b d"]
}
```

### Future layers (when redesign adds them)

When `MissionSystem` and `InventorySystem` are built, their state is added to the same snapshot:

```json
{
  "mission": { "currentActId": "act-01-sessions", "completedObjectives": ["get-weapon"] },
  "inventory": { "items": ["RIFT_CODE"] }
}
```

---

## The SaveManager Interface

`SaveManager.js` is a small utility module — no class, no constructor, four exported functions:

```js
// src/game/systems/SaveManager.js

const SAVE_KEY = "tmux-trek-save";
const SAVE_VERSION = 1;

export function saveGame(snapshot) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, ...snapshot }));
  } catch {
    // Storage full or private browsing — silently fail; game continues without saving
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.v !== SAVE_VERSION) return null;  // treat stale save as absent
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}
```

No external dependencies. No async. No class hierarchy. Four functions.

---

## Where Saves Are Triggered

### Checkpoint saves (durable progress)

Save after every event that represents meaningful progress. The game should never make the player redo something they already completed:

| Event | Where to hook |
|---|---|
| Challenge completed | `TmuxTrekApp.completeChallenge()` — already the central completion callback |
| Command unlocked | `GameState.unlockCommand()` |
| Beacon interaction (completion) | `TmuxTrekApp.handleBeaconInteraction()` |
| (Future) Collectible picked up | `InventorySystem.collect()` |
| (Future) Mission objective completed | `MissionSystem.completeObjective()` |

### Defensive save on page exit

Save the full snapshot when the user navigates away or closes the tab. This captures in-progress challenge state — the player's position in the NPC sequence even if mid-challenge.

```js
// In TmuxTrekApp.start() or constructor
window.addEventListener("beforeunload", () => {
  saveGame(this.#buildSnapshot());
});
```

### No timer-based saves

Do not save on an interval. Every save should be caused by a meaningful state change. Interval saves add complexity and noise without benefit.

---

## Boot-Time Load Sequence

In `TmuxTrekApp.constructor()`, after all subsystems are initialized but before `start()` is called:

```js
const saved = loadGame();
if (saved) {
  this.#restoreSnapshot(saved);
}
```

`#restoreSnapshot` applies the saved data to each subsystem:

```js
#restoreSnapshot(saved) {
  // 1. Restore SessionManager state
  if (saved.engine) {
    this.terminal.engine.sessionManager.restore(saved.engine);
  }

  // 2. Restore progression
  if (saved.progression) {
    this.currentNpcIndex = saved.progression.currentNpcIndex;
    this.completedChallenges = new Set(saved.progression.completedChallenges);
  }

  // 3. Restore unlocked commands
  if (saved.unlockedCommands) {
    saved.unlockedCommands.forEach(cmd => this.state.unlockCommand(cmd));
  }

  // 4. Restore session status display
  this.state.syncStatus(this.terminal.engine.getStatus());

  // 5. Update mission/instruction text to match restored NPC index
  const nextNpc = this.zone.npcs[this.currentNpcIndex];
  if (nextNpc) {
    this.state.setMission(`Meet ${nextNpc.name} for the next Rift lesson.`);
  } else {
    this.state.setMission("Return to the CLULIX beacon to close the training loop.");
  }
}
```

`SessionManager` needs one new method, `restore(snapshot)`, that rebuilds its `Map` from the serialized sessions array:

```js
restore(snapshot) {
  this.sessions.clear();
  this.activeSessionName = snapshot.activeSessionName;
  this.nextUnnamedSession = snapshot.nextUnnamedSession;
  for (const session of snapshot.sessions) {
    this.sessions.set(session.name, structuredClone(session));
  }
}
```

---

## Version Handling

The save format should include a version number from day one. When the game's data model changes (new fields, renamed sessions, new acts), the version number is bumped and any save with a lower version is discarded on load.

The current `SAVE_VERSION = 1` means: "this save format is valid while the game has one zone, five NPCs, and no inventory system." When `MissionSystem` and `InventorySystem` are added, bump to `SAVE_VERSION = 2` and add migration logic or simply discard v1 saves.

Discarding a stale save is always safe — the player starts fresh. The alternative (trying to migrate mismatched state) is fragile. Keep migration logic only if acts have shipped to real users who would lose real progress.

---

## Planned: Multi-Slot Saves (Phase 4)

The current implementation is a **single** slot under one key (`tmux-trek-save`, `SAVE_VERSION = 2`). [`../implementation-plan.md`](../implementation-plan.md) Phase 4 refactors this to **named, multiple saves** so a learner can keep separate runs (personal, classroom, demo). This refactor is deliberately scheduled *before* scoring, progress, and review-result state (Phase 5) so the persistence shape is settled once rather than migrated twice.

### Storage layout

Keep `localStorage`; change the key layout from one blob to an index plus per-slot blobs:

```
tmux-trek:saves        → { "version": 3, "activeId": "abc123", "slots": [ { "id": "abc123", "name": "Classroom run", "updatedAt": 1718841600000 } ] }
tmux-trek:save:abc123  → { ...the existing snapshot (engine, mission, inventory, unlocked, zone) plus score/progress }
```

The index holds only metadata (id, display name, timestamp) so the menu can render the slot list without parsing every blob. The per-slot key holds the same snapshot shape already in use, extended with the Phase 5 score/progress fields.

### Operations the menu needs

| Operation | Effect |
|---|---|
| New Game | create a slot (uuid + name), write an empty snapshot, set `activeId` |
| Continue | load the `activeId` slot |
| Select | switch `activeId` to a chosen slot and load it |
| Rename | update `name` in the index entry only |
| Delete | remove `tmux-trek:save:<id>` and its index entry; clear `activeId` if it pointed there |
| Clear All | remove every per-slot key and reset the index |

### Migration to v3

On first load after the bump, if a legacy `tmux-trek-save` (v2) key exists, wrap it as a slot named `default`, move it to `tmux-trek:save:<newid>`, set it active, and remove the old key. A v2 save that fails to parse is discarded (starting fresh is always safe, per *Version Handling* above). Bump `SAVE_VERSION` → 3.

### What stays the same

The snapshot *contents*, the "save between challenges, not inside them" rule, the `beforeunload` defensive save, and the no-timer-saves rule all carry over unchanged. Only the keying and the menu surface are new.

---

## What Is NOT Saved

- The Phaser camera position and active scene — these are derived from the NPC index and zone. No need to serialize.
- The xterm terminal content — on resume, the player is returned to the world map, not mid-challenge. The terminal is closed on save.
- The dialogue panel state — dialogue opens fresh when the player next interacts.
- Active challenge step index — on resume, the challenge has not been started yet (the player is at the NPC, not inside the terminal).

This means: **save points are between challenges, not inside them.** If the player is mid-challenge and closes the browser, they return to the world map with that challenge not yet started. They will need to walk to the NPC and begin again. This is the correct behavior — incomplete challenges should not be saved as complete.

---

## Testing

The save/load path needs two test levels:

### Unit tests (Vitest)

Test `SaveManager` in isolation with a `localStorage` mock:

```js
// tests/unit/SaveManager.test.js
import { saveGame, loadGame, clearSave } from "../../src/game/systems/SaveManager.js";

// Use jsdom's localStorage (already available via vitest's jsdom environment)

test("returns null when no save exists", () => {
  clearSave();
  expect(loadGame()).toBeNull();
});

test("round-trips a snapshot", () => {
  const snapshot = { progression: { currentNpcIndex: 2, completedChallenges: ["session-init"] } };
  saveGame(snapshot);
  expect(loadGame().progression.currentNpcIndex).toBe(2);
});

test("returns null for a wrong-version save", () => {
  localStorage.setItem("tmux-trek-save", JSON.stringify({ v: 0, progression: {} }));
  expect(loadGame()).toBeNull();
});

test("does not throw when localStorage is unavailable", () => {
  const orig = localStorage.setItem.bind(localStorage);
  localStorage.setItem = () => { throw new DOMException("QuotaExceededError"); };
  expect(() => saveGame({ progression: {} })).not.toThrow();
  localStorage.setItem = orig;
});
```

### End-to-end test (Playwright)

Add one e2e test that verifies cross-reload persistence:

```js
// In tests/e2e/gameplay.spec.js
test("resumes after reload", async ({ page }) => {
  await page.goto("http://localhost:4173/");
  // Complete Zrix challenge
  await completeZrixChallenge(page);
  // Reload
  await page.reload();
  // NPC index should be restored; Vrex should now be active
  await expect(page.locator("#game-root")).toHaveAttribute("data-active-npc", "vrex");
});
```

---

## Implementation Checklist

This can be done in one focused session — the surface area is small:

- [ ] Add `restore(snapshot)` method to `SessionManager`
- [ ] Add `#buildSnapshot()` and `#restoreSnapshot(saved)` to `TmuxTrekApp`
- [ ] Write `src/game/systems/SaveManager.js` (four functions, ~40 lines)
- [ ] Call `saveGame()` inside `TmuxTrekApp.completeChallenge()` and `GameState.unlockCommand()`
- [ ] Call `loadGame()` at the end of `TmuxTrekApp.constructor()`
- [ ] Register `beforeunload` listener in `TmuxTrekApp.start()`
- [ ] Write unit tests for `SaveManager` (four cases above)
- [ ] Write one Playwright reload test
- [ ] Update `doc/session-handoff.md` with the new save mechanism

Total new code: approximately 80 lines of production code, 40 lines of tests.
