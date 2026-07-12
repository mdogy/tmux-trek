# TMUX Trek — Code Review Fix Instructions

> **Status (July 12, 2026): RESOLVED.** All production fixes (CR-1 through CR-12) landed in commit `638ee82` and are verified present in the current tree. Test gaps TG-2, TG-5, and the CR-8/CR-10 tests exist in `tests/unit/`; TG-6 landed July 12, 2026 as `tests/unit/GridScene.interaction.test.js` (with the target-lookup logic extracted to `src/game/scenes/gridInteraction.js`). TG-1, TG-3, and TG-4 remain open — they need `TmuxTrekApp`/`TitleScene` instantiation, which pulls in Phaser and xterm.js; their behavior is covered end-to-end by `tests/e2e/gameplay.spec.js` (restore on reload) instead. This document is kept for reference only.

_Written June 21, 2026 against `main` at `c0e1299`. Each section names the exact file, method, and lines to change, shows the minimal code delta, and lists a verification step._

Read `session-handoff.md § Code Review Findings` for the why behind each item. This document is the how.

---

## Reading order

Fix CRITICAL items first (CR-1, CR-2, CR-3). Fix HIGH items next (CR-4, CR-5, CR-6). Everything else can go in a follow-up cleanup PR. Add the test-gap items (TG-\*) in the same PR as the corresponding fix.

---

## CR-1 + CR-2 + CR-13 — Event listener cleanup in `TmuxTrekApp`

**Files:** `src/game/TmuxTrekApp.js`

Three separate leaks, one `dispose()` method fixes all of them.

### What is wrong

1. `this.engineMissionUnsubscribers` (line 121) stores 4 engine-event unsubscribe functions. They are never called. If the app is created more than once (test mode resets, hot-reload) the old listeners fire for the lifetime of the tab.
2. `window.addEventListener("beforeunload", this.#persistSnapshot)` in `start()` (line 179) is never matched by a `removeEventListener`. Every call to `start()` stacks another listener.
3. `this.transitionSystem.dispose()` is never called. `TransitionSystem` has a working `dispose()` that unsubscribes engine events.

### Fix

**Step 1 — Add `dispose()` to `TmuxTrekApp`.**

Insert this method after the `start()` method (after line 180, before `resetToNewGame()`):

```js
dispose() {
  for (const unsub of this.engineMissionUnsubscribers) unsub();
  this.engineMissionUnsubscribers = [];
  this.transitionSystem.dispose();
  window.removeEventListener("beforeunload", this.#persistSnapshot);
}
```

**Step 2 — Guard against double-registration of the `beforeunload` listener.**

In `start()`, replace line 179:

```js
window.addEventListener("beforeunload", this.#persistSnapshot);
```

with:

```js
window.removeEventListener("beforeunload", this.#persistSnapshot);
window.addEventListener("beforeunload", this.#persistSnapshot);
```

The `removeEventListener` is a no-op on the first call and removes any stale registration on subsequent calls. It works because `this.#persistSnapshot` is a class-field arrow function with a stable identity.

**Step 3 — Wire `dispose()` into Phaser's game-destroy lifecycle.**

In `start()`, after the line `this.game.registry.set("app", this)` (line 178), add:

```js
this.game.events.once("destroy", () => this.dispose());
```

### Verification — TG-3

Add a unit test in `tests/unit/TmuxTrekApp.test.js` (create the file if it doesn't exist):

```js
import { describe, it, expect, vi, beforeEach } from "vitest";
// Use a lightweight JSDOM-compatible mock; TmuxTrekApp imports Phaser
// so this test must run in happy-dom or with Phaser mocked.

describe("TmuxTrekApp listener cleanup", () => {
  it("removeEventListener is called for beforeunload after dispose()", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const app = new TmuxTrekApp();
    app.dispose();
    expect(remove).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("engine unsubscribers are called on dispose()", () => {
    const app = new TmuxTrekApp();
    const spies = app.engineMissionUnsubscribers.map((fn) => vi.fn(fn));
    app.engineMissionUnsubscribers = spies;
    app.dispose();
    spies.forEach((spy) => expect(spy).toHaveBeenCalled());
  });
});
```

---

## CR-3 — UIController button listener leak

**File:** `src/game/systems/UIController.js`

### What is wrong

`#reviewButton(text, onClick)` (line 368) creates a button, calls `button.addEventListener("click", onClick)`, and returns the button. These buttons are assembled into overlays that are torn down via `replaceChildren()` on every `render()` call. The removed DOM nodes are eligible for GC, but until GC runs the listener closures (which close over `overlay`, `currentCard`, etc.) hold references to the previous render's state. On rapid state changes (e.g., every keystroke in a review) many stale closures accumulate simultaneously.

The same pattern appears in `#renderDialogueCard` (line 183) and `#renderCompletionOverlay` (line 217).

### Fix — event delegation on stable containers

Replace per-button `addEventListener` with one delegated listener per container. Buttons declare their intent via `data-action`. Handlers are registered in a `Map` that is repopulated at the start of each overlay render.

**Step 1 — Add a handler map and three delegated listeners to the constructor.**

In `constructor` (after line 48, the `this.reviewButton?.addEventListener` line), add:

```js
this._overlayHandlers = new Map();

const delegate = (root) =>
  root?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (btn) this._overlayHandlers.get(btn.dataset.action)?.();
  });
delegate(this.dialogueRoot);
delegate(this.reviewRoot);
delegate(this.completionRoot);
```

**Step 2 — Rewrite `#reviewButton` to register the handler instead of attaching a listener.**

Replace the existing `#reviewButton` method (lines 368–375):

```js
// OLD
#reviewButton(text, onClick) {
  const button = document.createElement("button");
  button.className = "review-button";
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}
```

with:

```js
// NEW
#reviewButton(text, actionKey, onClick) {
  const button = document.createElement("button");
  button.className = "review-button";
  button.type = "button";
  button.textContent = text;
  button.dataset.action = actionKey;
  this._overlayHandlers.set(actionKey, onClick);
  return button;
}
```

**Step 3 — Update every `#reviewButton` call site to pass a stable action key.**

All call sites are in `#renderReviewOverlay` and `#renderReviewGateOverlay`. Use these action-key constants (they do not need to be deduplicated because the Map is rebuilt every render):

In `#renderReviewOverlay`:

```js
const previous = this.#reviewButton("Previous", "review-prev", () =>
  this.onReviewPrevious?.(),
);
const flip = this.#reviewButton(
  overlay.showAnswer ? "Hide Answer" : "Flip Card",
  "review-flip",
  () => this.onReviewFlip?.(),
);
const next = this.#reviewButton("Next", "review-next", () =>
  this.onReviewNext?.(),
);
const gotIt = this.#reviewButton("Got It", "review-got-it", () =>
  this.onReviewRate?.(currentCard.id, "got-it"),
);
const reviewAgain = this.#reviewButton("Review Again", "review-again", () =>
  this.onReviewRate?.(currentCard.id, "review-again"),
);
const close = this.#reviewButton("Close", "review-close", () =>
  this.onReviewClose?.(),
);
```

In `#renderReviewGateOverlay`, inside the `for` loop over choices:

```js
const button = this.#reviewButton(choice.text, `gate-choice-${choice.id}`, () =>
  this.onReviewSelectChoice?.(question.id, choice.id),
);
```

Navigation and result buttons in `#renderReviewGateOverlay`:

```js
const previous = this.#reviewButton("Previous", "gate-prev", () =>
  this.onReviewPrevious?.(),
);
const next = this.#reviewButton("Next", "gate-next", () =>
  this.onReviewNext?.(),
);
// inside overlay.result block:
const primary = this.#reviewButton(
  overlay.result.passed ? "Close" : "Retry",
  "gate-primary",
  () =>
    overlay.result.passed ? this.onReviewClose?.() : this.onReviewRetryGate?.(),
);
// if !passed:
this.#reviewButton("Review Flash Cards", "gate-review-flash", () =>
  this.onOpenReview?.(),
);
// submit and close:
this.#reviewButton("Submit Check", "gate-submit", () =>
  this.onReviewSubmitGate?.(),
);
this.#reviewButton("Close", "gate-close", () => this.onReviewClose?.());
```

**Step 4 — Fix the dialogue "Continue" button.**

In `#renderDialogueCard` (line 183):

```js
// OLD
button.addEventListener("click", onAdvance);

// NEW — use a stable action key; onAdvance is fresh per card but the key is stable
button.dataset.action = "dialogue-advance";
this._overlayHandlers.set("dialogue-advance", onAdvance);
```

**Step 5 — Fix the completion overlay button.**

In `#renderCompletionOverlay` (line 217):

```js
// OLD
button.addEventListener("click", () => this.onCompletionAcknowledge?.());

// NEW
button.dataset.action = "completion-ack";
this._overlayHandlers.set("completion-ack", () =>
  this.onCompletionAcknowledge?.(),
);
```

### Verification

Manual: open the flash-card review, page through 5 cards, close. Open again. No focus errors, no stale state, buttons are responsive. The Playwright `title-save-slots.spec.js` review flow should still pass.

---

## CR-4 — `#restoreSnapshot` sets `lastMissionSnapshot = null` before triggering `#handleMissionUpdate`

**File:** `src/game/TmuxTrekApp.js`, method `#restoreSnapshot`, line 568.

### What is wrong (precise version)

`#restoreSnapshot` sets `this.lastMissionSnapshot = null` at line 568, then calls `this.missionSystem.restore(saved.mission)` at line 574. `MissionSystem.restore()` calls `this.#notify()` internally, which synchronously fires `#handleMissionUpdate(snapshot)`. Inside that handler, `previousCompleted = new Set(this.lastMissionSnapshot?.completedObjectives ?? [])` evaluates to an empty Set because `lastMissionSnapshot` is null.

This means every restored objective appears to be "newly completed", and `scoreSystem.awardObjective` is called for each one. In practice the double-award is blocked by `ScoreSystem.awardedEvents` (which is correctly restored before this point at line 571), so total score is not corrupted. **But** `progressSystem.markObjectiveComplete` is called unnecessarily for all already-completed objectives, and `latestDelta` in `GameState.score` will show a spurious "0 points" flash in the HUD score widget on load. More importantly, this code depends on `ScoreSystem.awardedEvents` as an implicit guard — a fact not documented anywhere — making the restore path fragile.

### Fix

In `#restoreSnapshot` (line 563), replace the single line:

```js
this.lastMissionSnapshot = null;
```

with:

```js
this.lastMissionSnapshot = saved.mission
  ? structuredClone(saved.mission)
  : null;
```

With this change, when `missionSystem.restore(saved.mission)` fires `#handleMissionUpdate`, the diff between `previousCompleted` and `nextCompleted` will be empty (both derived from `saved.mission`), so no `awardObjective` or `markObjectiveComplete` calls are made. The act-complete guard inside `#handleMissionUpdate`:

```js
if (currentProgress?.isActComplete && !this.lastMissionSnapshot) {
```

…will now evaluate `!this.lastMissionSnapshot` as `false`, so the if-branch doesn't fire. The restoration of any pending level-complete/gate overlay is handled by `#reopenPendingBoundaryGate()` which is called separately at line 582, so this branch suppression is correct and safe.

> **Note:** `resetToNewGame()` at line 187 sets `this.lastMissionSnapshot = null` then calls `this.missionSystem.restore({})`. Since the restore argument has `completedObjectives: []`, both `previousCompleted` and `nextCompleted` are empty, so the diff is empty regardless. That code path does not need to change.

### Verification — TG-1

Add to `tests/unit/TmuxTrekApp.test.js`:

```js
it("restoring a save with completed objectives does not call awardObjective", () => {
  // Build a save snapshot with one objective completed and non-zero score
  const saved = {
    mission: {
      currentActId: "act-01-sessions",
      currentObjectiveId: "collect-rift-code",
      completedObjectives: ["activate-rift-terminal"],
    },
    score: {
      total: 100,
      byAct: { "act-01-sessions": 100 },
      awardedEvents: ["objective:activate-rift-terminal"],
    },
    progress: { acts: {} },
    review: {},
    inventory: { items: [] },
    engine: { sessions: {}, activeSessionName: null },
    unlockedCommands: [],
    view: { currentZoneId: "bridge" },
  };

  const app = new TmuxTrekApp();
  const award = vi.spyOn(app.scoreSystem, "awardObjective");
  app.#restoreSnapshot(saved); // may need to expose via test helper
  expect(award).not.toHaveBeenCalled();
});
```

> If `#restoreSnapshot` is private-field-only, expose a `_restoreSnapshotForTesting(saved)` public method gated on `import.meta.env.TEST === "true"`, or test indirectly through `restoreActiveSave()` with a mocked `loadGame`.

---

## CR-5 — Prefix key can re-arm while already armed

**File:** `src/terminal/TmuxEmulator.js`, method `#handleKey`, line 84.

### What is wrong

```js
if (domEvent.ctrlKey && domEvent.key.toLowerCase() === "b") {
  domEvent.preventDefault();
  this.prefixArmed = true; // ← no guard
  this.renderer.writeln("^B");
  this.renderer.writeln("HELIX: prefix accepted. Awaiting the next key.");
  this.#prompt();
  return;
}
```

If `Ctrl+b` is pressed while `prefixArmed` is already `true`, the prefix is re-armed silently, and the previous `Ctrl+b` state is discarded. The HELIX feedback fires again ("prefix accepted"), confusing the player.

Real tmux behavior: a second `Ctrl+b` while armed sends a literal `^B` to the active pane. For the game, the simpler correct behavior is: ignore the second `Ctrl+b` (since pane raw input is out of scope).

### Fix

Add an early-return guard at the top of the `Ctrl+b` branch:

```js
if (domEvent.ctrlKey && domEvent.key.toLowerCase() === "b") {
  domEvent.preventDefault();
  if (this.prefixArmed) {
    // Already armed; ignore the repeat press.
    return;
  }
  this.prefixArmed = true;
  this.renderer.writeln("^B");
  this.renderer.writeln("HELIX: prefix accepted. Awaiting the next key.");
  this.#prompt();
  return;
}
```

### Verification — TG-5

Add to `tests/unit/TmuxEmulator.test.js` (or create it):

```js
it("does not re-arm the prefix when Ctrl+b is pressed twice", () => {
  // Set up emulator with a challenge that expects keybinding "d"
  emulator.openChallenge(mockChallenge);
  const writeln = vi.spyOn(emulator.renderer, "writeln");

  const ctrlB = { ctrlKey: true, key: "b", preventDefault: vi.fn() };
  emulator.#handleKey({ key: "b", domEvent: ctrlB }); // first press
  const callCount = writeln.mock.calls.length;
  emulator.#handleKey({ key: "b", domEvent: ctrlB }); // second press
  expect(writeln.mock.calls.length).toBe(callCount); // no new output
  expect(emulator.prefixArmed).toBe(true); // still armed
});
```

---

## CR-6 — Auth gate silently bypassed by whitespace-only password

**File:** `src/game/scenes/TitleScene.js`, method `create`, line 43.

### What is wrong

```js
const password = import.meta.env.VITE_AUTH_PASSWORD ?? "";
if (password && sessionStorage.getItem(AUTH_KEY) !== "1") {
```

`VITE_AUTH_PASSWORD="  "` (whitespace) evaluates as truthy, sets `password = "  "`, and the gate IS shown — but the player can enter two spaces and pass. More commonly, `VITE_AUTH_PASSWORD=" "` in an `.env` file is a developer typo that bypasses intent.

The deeper issue: there is no signal when the gate is silently not applied. A developer who sets `VITE_AUTH_PASSWORD=""` expecting the gate to be active gets no warning.

### Fix

Replace lines 43–44:

```js
const password = import.meta.env.VITE_AUTH_PASSWORD ?? "";
if (password && sessionStorage.getItem(AUTH_KEY) !== "1") {
```

with:

```js
const password = (import.meta.env.VITE_AUTH_PASSWORD ?? "").trim();
if (password && sessionStorage.getItem(AUTH_KEY) !== "1") {
```

**Also add a console warning** so a developer who accidentally ships with an empty gate config gets a signal. Add this immediately after the password declaration:

```js
if (import.meta.env.VITE_AUTH_PASSWORD !== undefined && !password) {
  console.warn(
    "[TmuxTrek] VITE_AUTH_PASSWORD is set but empty/whitespace — auth gate is disabled.",
  );
}
```

### Verification — TG-4

This is a pure-JS unit concern. Add to `tests/unit/TitleScene.auth.test.js`:

```js
it("_promptPassword is not called when env password is whitespace-only", () => {
  // Vitest can fake import.meta.env via vi.stubEnv
  vi.stubEnv("VITE_AUTH_PASSWORD", "   ");
  const scene = new TitleScene();
  scene.create = vi.fn(); // prevent full Phaser boot
  const prompt = vi.spyOn(scene, "_promptPassword");
  const showMenu = vi.spyOn(scene, "_showMenu").mockImplementation(() => {});
  scene.create();
  expect(prompt).not.toHaveBeenCalled();
  expect(showMenu).toHaveBeenCalled();
});
```

---

## CR-7 — FALSE POSITIVE (no fix needed)

The review flagged that `MissionSystem.restore()` does not call `#notify()`. **This is incorrect.** Reading the actual code at `src/game/systems/MissionSystem.js` line 138, `restore()` already calls `this.#notify()`:

```js
restore(snapshot = {}) {
  this.currentActId = snapshot.currentActId ?? null;
  this.currentObjectiveId = snapshot.currentObjectiveId ?? null;
  this.completedObjectives = new Set(snapshot.completedObjectives ?? []);
  this.#notify();   // ← already present
}
```

No change needed. The `#notify()` call IS the trigger for the CR-4 issue above, but the fix for that is in `TmuxTrekApp`, not here.

---

## CR-8 — `SaveManager.migrate()` passes corrupt v2 data into v3

**File:** `src/game/systems/SaveManager.js`, function `migrate`, lines 54–80.

### What is wrong

A v2 save with malformed content (e.g., `mission: null`, `engine: undefined`) is cloned verbatim into a v3 slot:

```js
storage.setItem(
  SLOT_PREFIX + id,
  JSON.stringify({ ...parsed, v: SAVE_VERSION }),
);
```

`normalizeIndex()` runs only on the slot index, not on the per-slot payload. Later `loadGame()` returns the corrupt blob unchanged, and `#restoreSnapshot` passes it to each system's `restore()` method, which may silently produce invalid in-memory state.

### Fix

Add a minimal shape validation before migrating. Insert this block after `if (parsed.v === 2 && index.slots.length === 0) {` (line 61) and before the `storage.setItem` call:

```js
// Validate required top-level keys are present before migrating.
// A corrupt v2 save is discarded (the legacy key is still removed below).
const requiredKeys = ["engine", "mission", "inventory"];
const hasRequiredKeys = requiredKeys.every(
  (key) => parsed[key] !== null && typeof parsed[key] === "object",
);
if (!hasRequiredKeys) {
  // Corrupt legacy save — discard without migration.
  storage?.removeItem("tmux-trek-save");
  return;
}
```

The full migration block after this fix:

```js
if (parsed.v === 2 && index.slots.length === 0) {
  const requiredKeys = ["engine", "mission", "inventory"];
  if (
    !requiredKeys.every(
      (key) => parsed[key] !== null && typeof parsed[key] === "object",
    )
  ) {
    storage?.removeItem("tmux-trek-save");
    return;
  }
  const id = uid();
  storage.setItem(
    SLOT_PREFIX + id,
    JSON.stringify({ ...parsed, v: SAVE_VERSION }),
  );
  writeIndex(
    {
      version: SAVE_VERSION,
      activeId: id,
      slots: [{ id, name: "default", updatedAt: Date.now() }],
    },
    storage,
  );
}
```

### Verification

Add to `tests/unit/SaveManager.test.js`:

```js
it("migrate() discards a v2 save missing required keys", () => {
  const storage = new Map();
  storage.getItem = (k) => storage.get(k) ?? null;
  storage.setItem = (k, v) => storage.set(k, v);
  storage.removeItem = (k) => storage.delete(k);

  storage.setItem(
    "tmux-trek-save",
    JSON.stringify({ v: 2, mission: null, engine: null, inventory: null }),
  );
  migrate(storage);

  // The legacy key should be removed, but no v3 slot created.
  expect(storage.get("tmux-trek-save")).toBeUndefined();
  expect(
    [...storage.keys()].filter((k) => k.startsWith("tmux-trek:save:")),
  ).toHaveLength(0);
});
```

---

## CR-9 — UIController rebuilds review overlay on every state change (focus/flicker)

**File:** `src/game/systems/UIController.js`, method `render`, lines 101–113.

### What is wrong

Every call to `render()` — including calls triggered by unrelated state changes while the review overlay is open — tears down and rebuilds the entire overlay DOM. This loses focus on whichever button the player had focused, interrupts CSS transitions, and (combined with CR-3) creates transient listener churn.

### Fix (minimal — render-key guard)

Add a `#reviewRenderKey` field to track what was last rendered. Skip the rebuild if the key is unchanged.

**Step 1 — Add instance field.** After the constructor's `this.toastTimer = null;` line, add:

```js
this._reviewRenderKey = null;
this._completionRenderKey = null;
```

**Step 2 — Compute render keys and skip rebuild if unchanged.**

Replace the review overlay render block (lines 101–113):

```js
if (snapshot.reviewOverlay) {
  if (snapshot.reviewOverlay.mode === "gate") {
    this.#renderReviewGateOverlay(snapshot.reviewOverlay);
  } else {
    this.#renderReviewOverlay(snapshot.reviewOverlay);
  }
} else {
  this.reviewRoot.replaceChildren();
  // ...
}
```

with:

```js
if (snapshot.reviewOverlay) {
  const key = this.#reviewKey(snapshot.reviewOverlay);
  if (key !== this._reviewRenderKey) {
    this._reviewRenderKey = key;
    if (snapshot.reviewOverlay.mode === "gate") {
      this.#renderReviewGateOverlay(snapshot.reviewOverlay);
    } else {
      this.#renderReviewOverlay(snapshot.reviewOverlay);
    }
  }
} else {
  if (this._reviewRenderKey !== null) {
    this._reviewRenderKey = null;
    this.reviewRoot.replaceChildren();
    delete this.reviewRoot.dataset.reviewMode;
    delete this.reviewRoot.dataset.reviewCard;
    delete this.reviewRoot.dataset.reviewAct;
    delete this.reviewRoot.dataset.reviewQuestion;
  }
}
```

**Step 3 — Add `#reviewKey` helper:**

```js
#reviewKey(overlay) {
  if (overlay.mode === "gate") {
    return `gate:${overlay.actId}:${overlay.currentIndex}:${Boolean(overlay.result)}:${JSON.stringify(overlay.answers)}`;
  }
  return `fc:${overlay.currentIndex}:${overlay.showAnswer}:${overlay.cards?.[overlay.currentIndex]?.id}`;
}
```

Apply the same pattern to the completion overlay:

```js
if (snapshot.completionOverlay) {
  const key = `completion:${snapshot.completionOverlay.title}`;
  if (key !== this._completionRenderKey) {
    this._completionRenderKey = key;
    this.#renderCompletionOverlay(snapshot.completionOverlay);
  }
} else {
  if (this._completionRenderKey !== null) {
    this._completionRenderKey = null;
    this.completionRoot.replaceChildren();
    delete this.completionRoot.dataset.actComplete;
  }
}
```

### Verification

Play through the flash-card review. Type in a different terminal input (any key that would trigger a `GameState` update while the review is open). The review card should not lose focus or flicker.

---

## CR-10 — ProgressSystem timestamps not range-validated on restore

**File:** `src/game/systems/ProgressSystem.js`, method `restore`, lines 106–119.

### What is wrong

`Number.isFinite()` accepts any finite number, including future timestamps or `startedAt > completedAt`. A tampered or corrupted save can produce negative `elapsedMs` which the HUD formats as `"-1:23"` or similar.

### Fix

Replace the timestamp assignment lines inside the `for...of` loop (lines 110–114):

```js
// OLD
startedAt: Number.isFinite(entry?.startedAt) ? entry.startedAt : null,
completedAt: Number.isFinite(entry?.completedAt) ? entry.completedAt : null,
```

with:

```js
// NEW
const now = Date.now();
const startedAt =
  Number.isFinite(entry?.startedAt) && entry.startedAt <= now
    ? entry.startedAt
    : null;
const completedAt =
  startedAt !== null &&
  Number.isFinite(entry?.completedAt) &&
  entry.completedAt >= startedAt &&
  entry.completedAt <= now
    ? entry.completedAt
    : null;
```

Then use those local variables in the `nextActs[actId]` assignment:

```js
nextActs[actId] = {
  startedAt,
  completedAt,
  completedObjectiveIds: Array.isArray(entry?.completedObjectiveIds)
    ? entry.completedObjectiveIds.filter((id) => typeof id === "string")
    : [],
};
```

> Note: the `const now = Date.now()` declaration must be hoisted outside the for loop if you want a consistent "current time" across all entries in the same restore call. Move it to just before the loop.

### Verification

Add to `tests/unit/ProgressSystem.test.js`:

```js
it("clamps future startedAt to null on restore", () => {
  const sys = new ProgressSystem([{ id: "a-1", title: "A", objectives: [] }]);
  sys.restore({
    acts: {
      "a-1": {
        startedAt: 9999999999999,
        completedAt: 9999999999999,
        completedObjectiveIds: [],
      },
    },
  });
  expect(sys.getActSummary("a-1").startedAt).toBeNull();
});

it("clamps completedAt that precedes startedAt to null", () => {
  const start = Date.now() - 10000;
  const sys = new ProgressSystem([{ id: "a-1", title: "A", objectives: [] }]);
  sys.restore({
    acts: {
      "a-1": {
        startedAt: start,
        completedAt: start - 1,
        completedObjectiveIds: [],
      },
    },
  });
  expect(sys.getActSummary("a-1").completedAt).toBeNull();
});
```

---

## CR-11 — Ambient audio bleeds between scenes

**File:** `src/game/scenes/BridgeScene.js` (line 24), `src/game/scenes/ArmoryScene.js`, `src/game/scenes/SurfaceScene.js`, `src/game/scenes/GridScene.js`.

### What is wrong

`BridgeScene.createZoneDecorations()` correctly starts and stops the ambient:

```js
startAmbient("bridge");
this.events.once("shutdown", stopAmbient);
```

`ArmoryScene.createZoneDecorations()` and `SurfaceScene.createZoneDecorations()` do not call `stopAmbient()` on shutdown. If the player enters the Bridge (ambient starts), then navigates to the Armory (bridge shuts down, ambient stops via the Bridge handler — this actually works), and then returns to the Bridge again, a new ambient starts. However, if the audio node is ever not cleaned up (e.g., a fast scene transition interrupts the Phaser `shutdown` event), the drone persists.

The real risk is that `GridScene` has no base `shutdown` handler that stops ambient. If a future scene forgets to add the `once("shutdown", stopAmbient)` line, ambient will bleed indefinitely.

### Fix — centralise `stopAmbient` in `GridScene`

Read `src/game/scenes/GridScene.js` fully to confirm there is no existing `shutdown` lifecycle hook. Then add one near the bottom of `GridScene`, before the class closing brace:

```js
// In GridScene.js, add this method:
// Subclasses that need extra shutdown logic should call super.shutdown() if they override.
shutdown() {
  const { stopAmbient } = require("../systems/AudioSystem.js");
  // AudioSystem uses a module-level OscillatorNode; stopAmbient() is idempotent.
  stopAmbient();
}
```

Because GridScene uses ES modules and not CommonJS, the import should be at the top of the file:

```js
import { stopAmbient } from "../systems/AudioSystem.js";
```

And remove the inline `this.events.once("shutdown", stopAmbient)` from `BridgeScene.createZoneDecorations()` since the base class now handles it:

```js
// BridgeScene.createZoneDecorations() — remove this line:
this.events.once("shutdown", stopAmbient); // ← delete
// Keep:
startAmbient("bridge");
```

**Phaser lifecycle note:** Phaser calls `shutdown()` on a scene when it is stopped or replaced. `GridScene.shutdown()` will be called automatically when `scene.start(otherScene)` is invoked. Verify that Phaser's scene lifecycle calls `shutdown` on your base class by checking that `BridgeScene` does not override `shutdown` without calling `super.shutdown()`.

### Verification — TG-7

Add an integration test that mounts a mock GridScene and verifies `stopAmbient` is called on shutdown. Or verify manually: start on Bridge (hear drone), navigate to Surface, confirm drone stops.

---

## CR-12 — Password value retained in DOM before removal

**File:** `src/game/scenes/TitleScene.js`, method `_removeDomInput`, lines 392–399.

### What is wrong

```js
_removeDomInput() {
  const overlay = document.getElementById("title-input-overlay");
  if (!overlay) return;
  overlay.remove();   // ← input.value is still set
  // ...
}
```

The input element's `value` is never cleared before the node is removed from the DOM. The node is eligible for GC, but until collected its value persists in memory. Additionally, `onSubmit(input.value)` at line 382 is called BEFORE `_removeDomInput`, so the value has already been read — clearing it after submission is safe and correct.

### Fix

In `_removeDomInput`, before `overlay.remove()`, add:

```js
_removeDomInput() {
  const overlay = document.getElementById("title-input-overlay");
  if (!overlay) return;
  const input = overlay.querySelector("input");
  if (input) input.value = "";     // ← clear before removal
  overlay.remove();
  requestAnimationFrame(() => document.querySelector("#game-root")?.focus());
}
```

### Verification

No automated test needed for this level of risk. Verify manually: open devtools Memory tab, take a heap snapshot after entering and submitting a password, confirm no detached `HTMLInputElement` nodes retain non-empty `value`.

---

## Test gaps without a corresponding fix

The following test gaps do not require production code changes; they need tests added to catch regressions:

| ID   | Test to add                                                                   | File                                       |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| TG-2 | `MissionSystem.restore()` fires subscriber immediately with updated snapshot  | `tests/unit/MissionSystem.test.js`         |
| TG-6 | `GridScene` interaction: target found at Chebyshev distance 2, not found at 3 | `tests/unit/GridScene.interaction.test.js` |

For TG-2:

```js
it("subscribe listener receives updated state after restore()", () => {
  const sys = new MissionSystem([act01Sessions]);
  sys.loadAct("act-01-sessions");
  sys.completeObjective("activate-rift-terminal");

  // Save snapshot with one completed objective.
  const snapshot = sys.getSnapshot();

  // Create a fresh system and restore.
  const sys2 = new MissionSystem([act01Sessions]);
  const received = [];
  sys2.subscribe((s) => received.push(s));
  sys2.restore(snapshot);

  // The listener should have been called with the restored state.
  const last = received.at(-1);
  expect(last.completedObjectives).toContain("activate-rift-terminal");
});
```

---

## PR sequence suggestion

| PR  | Items                    | Risk                                               |
| --- | ------------------------ | -------------------------------------------------- |
| 1   | CR-1, CR-2, CR-13 + TG-3 | Low — adds cleanup, no behavior change             |
| 1   | CR-4 + TG-1              | Low — removes unnecessary work on restore          |
| 1   | CR-5 + TG-5              | Low — early return added                           |
| 1   | CR-6 + TG-4              | Low — `.trim()` + console.warn                     |
| 2   | CR-3                     | Medium — refactor; needs careful Playwright re-run |
| 2   | CR-9                     | Medium — render-key guard; verify focus behavior   |
| 3   | CR-8                     | Low — new guard in migrate()                       |
| 3   | CR-10 + TG-6 ref         | Low — add timestamp range check                    |
| 3   | CR-11 + TG-7             | Low — move stopAmbient to GridScene base           |
| 3   | CR-12                    | Trivial — single line                              |
| 3   | TG-2, TG-6               | Test-only                                          |

All PRs follow the standard delivery workflow in `delivery-workflow.md`. Run `npm run lint && npm run test && npm run test:e2e` before opening each PR.
