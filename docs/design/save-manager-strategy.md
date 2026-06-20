# SaveManager: Browser Persistence Strategy

_Written June 19, 2026. Updated June 20, 2026 after the multi-slot Phase 4 implementation._

> **Status: implemented (multi-slot).** `src/game/systems/SaveManager.js` is live with `SAVE_VERSION = 3`, a slot index at `tmux-trek:saves`, and per-slot blobs at `tmux-trek:save:<id>`. It supports new / continue / rename / delete / clear-all, validates malformed storage defensively, and migrates a v2 single-slot save to a named `default` slot when no v3 slots exist. For current truth see [`../session-handoff.md`](../session-handoff.md).

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

| Option           | Verdict      | Reason                                                                                                                                              |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `localStorage`   | **Use this** | Synchronous, simple API, persists across tab close and browser restart, ~5–10MB quota (game state is <10KB), works on GitHub Pages with zero server |
| `sessionStorage` | No           | Cleared when the tab is closed — defeats the purpose                                                                                                |
| Cookies          | No           | 4KB limit, sent over the network on every request, wrong tool for application state                                                                 |
| `IndexedDB`      | No           | Async, complex API, designed for large binary blobs — overkill for JSON game state                                                                  |
| URL hash / query | No           | Limited length, exposes state in the URL, breaks sharing links                                                                                      |

`localStorage` is synchronous, which means save and load operations do not require async/await or error-callback patterns. `SaveManager` stays a small utility module rather than a class. The game state that needs persisting is small: a few sessions, mission progress, inventory, unlocked commands, current zone, and later score/review data. Under any realistic scenario this stays well under 50KB.

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
        {
          "id": 0,
          "name": "main",
          "activePaneId": 0,
          "panes": [{ "id": 0, "title": "shell" }]
        }
      ]
    }
  ],
  "activeSessionName": null,
  "nextUnnamedSession": 1
}
```

### 2. Game progression state (`MissionSystem` / `InventorySystem` / `TmuxTrekApp`)

Current snapshots store mission, inventory, unlocked commands, and view state:

```json
{
  "mission": {
    "currentActId": "act-01-sessions",
    "completedObjectives": ["collect-rift-code"]
  },
  "inventory": { "items": ["RIFT_CODE"] },
  "unlockedCommands": ["tmux", "tmux new -s armory"],
  "view": { "currentZoneId": "surface" }
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

### Future layers

Phase 5 score/progress/review state will be added to the per-slot blob:

```json
{
  "score": { "total": 1200, "byAct": { "act-01-sessions": 1200 } },
  "review": { "passedGates": ["act-01-sessions"], "flashCards": {} }
}
```

---

## The SaveManager Interface

`SaveManager.js` is a small utility module — no class, no constructor. Current exports:

```js
SAVE_VERSION;
newSlot(name);
listSlots();
getActiveSlotId();
setActiveSlotId(id);
deleteSlot(id);
renameSlot(id, name);
clearAllSlots();
hasSave();
saveGame(snapshot);
loadGame();
migrate();
clearSave(); // backward-compatible alias for clearAllSlots()
```

No external dependencies. No async. No class hierarchy.

---

## Where Saves Are Triggered

### Checkpoint saves (durable progress)

Save after every event that represents meaningful progress. The game should never make the player redo something they already completed:

| Event                                | Where to hook                                                               |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Challenge completed                  | `TmuxTrekApp.completeChallenge()` — already the central completion callback |
| Command unlocked                     | `GameState.unlockCommand()`                                                 |
| Beacon interaction (completion)      | `TmuxTrekApp.handleBeaconInteraction()`                                     |
| (Future) Collectible picked up       | `InventorySystem.collect()`                                                 |
| (Future) Mission objective completed | `MissionSystem.completeObjective()`                                         |

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

`TmuxTrekApp.start()` chooses the correct front-door path:

```js
if (new URLSearchParams(window.location.search).get("testMode") === "1") {
  if (hasSave()) {
    this.restoreActiveSave();
  } else {
    newSlot("test");
    this.resetToNewGame();
  }
}
```

Normal browser play enters through `TitleScene`, where New Game creates a slot and Continue / Manage Saves restore the selected slot. The Playwright vertical-slice path bypasses `TitleScene` with `?testMode=1` so reload assertions are deterministic without leaking a page-global flag into the title-flow spec.

---

## Version Handling

The save format should include a version number from day one. When the game's data model changes (new fields, renamed sessions, new acts), the version number is bumped and any save with a lower version is discarded on load.

The current `SAVE_VERSION = 3` means: multi-slot saves with mission, inventory, unlocked commands, current zone, and engine state. `migrate()` converts a v2 single-slot save to a v3 `default` slot only if no v3 slots already exist. Corrupt or wrong-version data is treated as absent and removed where safe.

---

## Current: Multi-Slot Saves (Phase 4)

The current implementation uses **named, multiple saves** so a learner can keep separate runs (personal, classroom, demo). This refactor landed before scoring, progress, and review-result state (Phase 5) so the persistence shape is settled once rather than migrated twice.

### Storage layout

Keep `localStorage`; change the key layout from one blob to an index plus per-slot blobs:

```
tmux-trek:saves        → { "version": 3, "activeId": "abc123", "slots": [ { "id": "abc123", "name": "Classroom run", "updatedAt": 1718841600000 } ] }
tmux-trek:save:abc123  → { ...the existing snapshot (engine, mission, inventory, unlocked, zone) plus score/progress }
```

The index holds only metadata (id, display name, timestamp) so the menu can render the slot list without parsing every blob. The per-slot key holds the same snapshot shape already in use, extended with the Phase 5 score/progress fields.

### Operations the menu needs

| Operation | Effect                                                                                 |
| --------- | -------------------------------------------------------------------------------------- |
| New Game  | create a slot (uuid + name), write an empty snapshot, set `activeId`                   |
| Continue  | load the `activeId` slot                                                               |
| Select    | switch `activeId` to a chosen slot and load it                                         |
| Rename    | update `name` in the index entry only                                                  |
| Delete    | remove `tmux-trek:save:<id>` and its index entry; clear `activeId` if it pointed there |
| Clear All | remove every per-slot key and reset the index                                          |

### Migration to v3

On first load after the bump, if a legacy `tmux-trek-save` (v2) key exists, wrap it as a slot named `default`, move it to `tmux-trek:save:<newid>`, set it active, and remove the old key. A v2 save that fails to parse is discarded (starting fresh is always safe, per _Version Handling_ above). Bump `SAVE_VERSION` → 3.

### What stays the same

The snapshot _contents_, the "save between challenges, not inside them" rule, the `beforeunload` defensive save, and the no-timer-saves rule all carry over unchanged. Only the keying and the menu surface are new.

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

`tests/unit/SaveManager.test.js` uses an injected storage mock so it can test the persistence boundary without jsdom. Coverage includes slot creation, active-slot switching, rename/delete/clear, snapshot round-trip, wrong-version and corrupt blobs, malformed index recovery, v2 migration, and "existing v3 index wins over legacy v2" behavior.

### End-to-end test (Playwright)

Two Playwright specs now cover the browser layer:

- `tests/e2e/gameplay.spec.js` drives the full vertical slice and verifies reload/restore mid-act.
- `tests/e2e/title-save-slots.spec.js` covers the front-door title flow: New Game, Continue, rename, and delete.

---

## Implementation Checklist

Current implementation checklist:

- [x] `SessionManager.restore(snapshot)` restores serialized engine state.
- [x] `TmuxTrekApp.#buildSnapshot()` and `#restoreSnapshot(saved)` compose engine, mission, inventory, unlocked commands, and view state.
- [x] `SaveManager` stores a v3 slot index plus per-slot blobs.
- [x] `TitleScene` exposes New Game, Continue, and Manage Saves.
- [x] `migrate()` converts a v2 single-slot save to a v3 `default` slot when appropriate.
- [x] `beforeunload` persists the active slot in normal browser play.
- [x] Unit tests cover normal, corrupt, stale, and migration cases.
- [x] Playwright covers vertical-slice reload/restore and title save-slot management.
