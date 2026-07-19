# Mobile Implementation Plan

_Created June 24, 2026. Execution plan for implementing the adopted mobile-web stance in small, checkpointed steps._

This plan turns [`mobile-web-strategy.md`](mobile-web-strategy.md) into implementation work that a lower-capability agent can execute with limited context. The product rule is unchanged: **full tmux execution requires a real keyboard; touch-only mobile gets Review Mode, not fake muscle-memory play.**

## Non-Negotiables

- Do not build the Tier 3 on-screen tmux control bar in this plan.
- Do not remap the default `Ctrl+b` curriculum for touch convenience.
- Do not let touch-only users enter the execution path without an explicit keyboard override.
- Do not break existing desktop keyboard flows.
- Prefer unit tests for capability and routing decisions; use Playwright only for browser-level proof.
- After each checkpoint: run focused tests, run the broader baseline listed for that checkpoint, update docs if behavior changed, commit, and push.
- If the same failure repeats 3 times without a new hypothesis, stop and record the blocker in `docs/session-handoff.md`.

## Context Packet For Agents

Read only these files before starting:

- `docs/design/mobile-web-strategy.md`
- `docs/design/mobile-implementation-plan.md`
- `docs/session-handoff.md`
- `src/game/TmuxTrekApp.js`
- `src/game/scenes/TitleScene.js`
- `src/game/systems/UIController.js`
- `src/game/systems/ReviewSystem.js`
- `tests/e2e/title-save-slots.spec.js`

Do not read the whole repo unless a test failure points to a specific file.

## Checkpoint 1 — Capability Service

**Goal:** add one shared service that answers "can this session send real tmux prefix input?"

Need-to-know:

- Browser APIs cannot reliably report whether a hardware keyboard is attached.
- The strongest signal is receiving a real `keydown`.
- Touch or coarse pointer alone must not imply keyboard capability.

Target files:

- `src/game/systems/InputCapability.js` new
- `tests/unit/InputCapability.test.js` new
- `src/game/TmuxTrekApp.js` only if needed to construct/share the service

Implementation instructions:

- Add an `InputCapability` class with a small snapshot API.
- Track at least: `hasTouch`, `hasFinePointer`, `hasSeenKeyboardInput`, `keyboardOverride`.
- Derive `canSendPrefix` from `hasSeenKeyboardInput || keyboardOverride`.
- Add `recordKeyboardInput(event)` and `setKeyboardOverride(enabled)`.
- Keep DOM reads injectable or isolated so unit tests can construct the service without a browser.
- Do not add routing or UI in this checkpoint.

Required unit tests:

- Touch-only starts with `canSendPrefix === false`.
- Fine pointer alone does not imply `canSendPrefix`.
- First keyboard event flips `hasSeenKeyboardInput` and `canSendPrefix`.
- Keyboard override enables and disables `canSendPrefix`.
- Null or malformed events do not crash.

Verification:

- `npm run test -- tests/unit/InputCapability.test.js`
- `npm run lint`
- `npm run test`

Commit:

- `feat(mobile): add input capability service`

## Checkpoint 2 — App Wiring And Debug State

**Goal:** make capability state available to scenes and testable from Playwright without changing player flow.

Need-to-know:

- `TmuxTrekApp` already coordinates systems and scene registry access.
- Browser tests use stable `data-*` attributes on roots.
- This checkpoint should not visibly change the title menu yet.

Target files:

- `src/game/TmuxTrekApp.js`
- `src/game/scenes/TitleScene.js` or the shared root-debug writer if one exists
- `tests/unit/InputCapability.test.js`
- `tests/e2e/mobile-capability.spec.js` new

Implementation instructions:

- Construct one `InputCapability` instance in `TmuxTrekApp`.
- Register a document/window `keydown` listener that calls `recordKeyboardInput`.
- Dispose that listener when the app disposes, following existing cleanup patterns.
- Expose a read-only capability snapshot through the app.
- Add stable debug attributes in normal title/game roots, for example `data-can-send-prefix` and `data-input-mode`.
- Do not route touch users yet.

Required tests:

- Unit test any new app-facing capability API if it is pure enough.
- Playwright desktop/default load eventually reports `data-can-send-prefix` after a keyboard event.
- Mobile/coarse-pointer emulation starts with `data-can-send-prefix="false"`.

Verification:

- `npm run test`
- `npm run test:e2e -- tests/e2e/mobile-capability.spec.js`
- `npm run lint`

Commit:

- `feat(mobile): expose input capability state`

## Checkpoint 3 — Touch-Only Title Routing

**Goal:** show touch-only users the honest path: Review Mode first, full game only with keyboard or override.

Need-to-know:

- `TitleScene` owns the front door.
- Review already opens from title when an active save has reviewable commands.
- Empty review state must be acceptable; no unlocked cards should not crash.

Target files:

- `src/game/scenes/TitleScene.js`
- `src/game/TmuxTrekApp.js`
- `src/game/systems/UIController.js` only if the review entry needs a safe empty state
- `tests/e2e/mobile-routing.spec.js` new

Implementation instructions:

- If `canSendPrefix` is false and the session appears touch-oriented, make Review Mode the recommended action.
- Add an explicit "I have a keyboard" override that calls `setKeyboardOverride(true)` and reveals the normal New Game / Continue flow.
- Keep desktop/default title behavior unchanged.
- Use existing menu patterns; do not redesign the title screen.
- Copy must be honest: review on touch, connect/use a keyboard for full play.

Required tests:

- Mobile viewport/coarse pointer shows the review-first recommendation.
- Pressing the keyboard override reveals normal title actions.
- Desktop/default title flow still supports New Game / Continue / Manage Saves.
- Touch-only with no reviewable save shows an empty review message instead of crashing.

Verification:

- `npm run test`
- `npm run test:e2e -- tests/e2e/mobile-routing.spec.js`
- `npm run test:e2e -- tests/e2e/title-save-slots.spec.js`
- `npm run lint`

Commit:

- `feat(mobile): route touch users toward review`

## Checkpoint 4 — Review Mode Hardening

**Goal:** make the existing review surfaces robust enough to be the touch-first destination.

**Status (July 17, 2026): partially complete.** Review/dialogue buttons now enforce the
44px touch minimum at every viewport (not just ≤540px), the flash-card review overlay is
verified fully touch-operable on all three device profiles, and layout-fit checks run in
`tests/e2e/mobile/`. Remaining from this checkpoint: the explicit empty-review state and
the mobile-routing entry point (blocked on Checkpoint 3).

Need-to-know:

- This is not a visual redesign.
- Review surfaces are Phase 5 systems; keep their data path intact.
- Controls should be tappable and not depend on hover.

Target files:

- `src/game/systems/UIController.js`
- `src/game/systems/ReviewSystem.js`
- `src/styles.css` or the existing stylesheet
- `tests/e2e/mobile-review.spec.js` new, or extend `mobile-routing.spec.js`

Implementation instructions:

- Add or verify a clear empty state for no unlocked review cards.
- Ensure buttons used in review are at least 44px tall on mobile breakpoints.
- Ensure review overlay fits a common phone landscape viewport without clipping primary actions.
- Do not change scoring, review persistence, or question-bank semantics.

Required tests:

- Existing save with unlocked commands can open flash-card review from mobile routing.
- Empty review state is visible and has a way back.
- Existing desktop title review test still passes.

Verification:

- `npm run test`
- `npm run test:e2e -- tests/e2e/mobile-review.spec.js` if created
- `npm run test:e2e -- tests/e2e/title-save-slots.spec.js`
- `npm run lint`

Commit:

- `fix(mobile): harden review mode for touch`

## Checkpoint 5 — Responsive Shell Smoke Pass

**Goal:** prevent obvious mobile layout failures for the title, review, and keyboard-equipped game path.

**Status:** implemented for the current shell on June 29, 2026, and superseded on
July 17, 2026 by the device-profile mobile usability suite. The Phaser canvas uses
`Scale.FIT`, the viewport panel keeps a responsive 4:3 aspect ratio, safe-area spacing is
applied at mobile breakpoints. `tests/e2e/mobile-layout.spec.js` (viewport-only checks)
was folded into `tests/e2e/mobile/` (see Checkpoint 5b below). Touch-only Review Mode
routing remains a separate checkpoint.

Need-to-know:

- Tier 1 means keyboard-equipped mobile/tablet can play the real game.
- It is acceptable to require landscape for execution.
- This checkpoint is a smoke pass, not a full mobile redesign.

Target files:

- Main stylesheet
- Phaser boot/config file if scale mode is currently desktop-fixed
- `tests/e2e/mobile-layout.spec.js` new

Implementation instructions:

- Add safe-area CSS variables or padding where overlays touch screen edges.
- Check `visualViewport` only if current layout breaks under soft keyboard or mobile browser chrome.
- Ensure title and review surfaces do not horizontally overflow at representative mobile widths.
- For portrait execution screens, show a clear keyboard/landscape prompt or keep the title/review path usable.
- Do not add a D-pad or prefix bar.

Required tests:

- Phone landscape viewport: title root visible, no horizontal overflow.
- Phone landscape viewport: review overlay visible and primary action visible.
- Tablet landscape viewport with keyboard override: game root loads and is not blank.
- Optional portrait smoke: title/review remains usable or prompt is visible.

Verification:

- `npm run test:e2e -- tests/e2e/mobile-layout.spec.js`
- `npm run build`
- `npm run lint`

Commit:

- `fix(mobile): harden responsive shell layout`

## Checkpoint 5b — Device-Profile Usability Suite _(completed July 17, 2026)_

**Goal:** replace viewport-only mobile checks with a real device-profile touch test suite, and fix what it catches.

**Status: complete** (PR #22). What landed:

- `playwright.config.js` projects: `desktop` (existing specs), `mobile-chrome` (Pixel 7),
  `mobile-safari` (iPhone 14, WebKit), `tablet-safari` (iPad gen 7, WebKit). All specs in
  `tests/e2e/mobile/` run on all three device profiles with real touch events
  (`page.touchscreen.tap`, `locator.tap()`), mobile viewports, and device pixel ratios.
- Suite contents (21 specs × 3 devices): layout fit and overflow in both orientations,
  sidebar stacking, every title flow by touch (new game / continue / load slot /
  delete-all / cold-tap activation), name-input focus for the virtual keyboard plus the
  iOS ≥16px font zoom rule, rotation on title / mid-game / with the dialog open,
  tap-safety on the keyboard-driven play field, touch-operated flash-card review,
  terminal fit and focus on a phone, and save persistence.
- Three product bugs found and fixed: the boot loading overlay intercepted taps during its
  500ms fade-out (now `pointer-events: none` immediately, with a regression test); Phaser
  translated taps through canvas bounds cached at boot, so taps missed after font-load
  reflow and the canvas never re-fit on rotation (scale now refreshes on
  `document.fonts.ready`, a body `ResizeObserver`, and window resize); review/dialogue
  buttons were sub-44px on tablets (minimum now unconditional).
- Tooling: `npm run test:e2e:mobile` / `test:e2e:desktop`; CI installs WebKit;
  suite conventions documented in [`../mobile-testing.md`](../mobile-testing.md).

**Known tracked gap → future Checkpoint 7:** title-menu hit zones are 540×50 in
960×720 game space and scale to ~20px tall on phones, far below the 44px guideline.
Encoded as a `test.fail()` in `tests/e2e/mobile/title-touch.spec.js`, which flips to an
alert the moment it starts passing. Fixing it is a design decision:
either enlarge the game-space hit zones/menu typography, or render the title menu as a
DOM overlay below a canvas size threshold. Take the decision alongside Checkpoint 3
(touch routing), since a DOM menu would also simplify review-first routing copy.

## Checkpoint 6 — Documentation Sync

**Goal:** record exactly what mobile tier is implemented and what remains deferred.

Target files:

- `docs/session-handoff.md`
- `docs/implementation-plan.md`
- `docs/design/mobile-web-strategy.md` only if the product stance changed
- `history.md`

Implementation instructions:

- Mark capability service status.
- Mark touch Review Mode routing status.
- List new mobile tests.
- State clearly that Tier 3 remains deferred and research-gated.
- Update the immediate next task if mobile becomes active work.

Verification:

- `npm run lint`
- `npm run test`

Commit:

- `docs(mobile): record capability routing status`

## Subagent Usage

Use subagents for inspection only. Give them exact files and strict output limits.

Good subagent prompts:

- "Inspect `src/game/scenes/TitleScene.js`. Report the smallest insertion point for mobile Review Mode routing. Max 20 lines."
- "Inspect `src/game/systems/UIController.js` and `ReviewSystem.js`. Report the public path for opening flash-card review and any empty-state risk. Max 20 lines."
- "Inspect the main stylesheet. Report existing mobile breakpoints and any obvious fixed-width risks. Max 20 lines."
- "Inspect current e2e specs. Recommend whether mobile coverage should extend an existing spec or use a new spec. Max 20 lines."

Bad subagent prompts:

- "Implement mobile support."
- "Make the game responsive."
- "Design touch controls."
- "Refactor the UI."

## Bug-Loop Safeties

Stop and checkpoint if any of these happen:

- The same test fails 3 times with no new root-cause hypothesis.
- The agent is about to edit more than 5 production files in one checkpoint.
- The agent starts adding a touch D-pad, prefix bar, or command keyboard.
- Desktop title or gameplay e2e fails and the fix is not directly tied to the checkpoint.
- The mobile route requires changing mission, curriculum, or tmux engine semantics.

When stopped, record:

- Last green commit.
- Failing command.
- Exact observed failure.
- Files changed.
- Best next hypothesis.

## Definition Of Done

The mobile foundation is complete when:

- Capability detection is centralized and unit-tested.
- Touch-only sessions route to Review Mode or a clear review-first empty state.
- Keyboard users on mobile-sized screens can still access full gameplay.
- At least one mobile viewport Playwright test covers the title/review route.
- Docs state the implemented tier and confirm Tier 3 is still deferred.
