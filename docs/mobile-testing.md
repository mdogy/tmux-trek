# Mobile Usability Test Suite

The mobile suite lives in `tests/e2e/mobile/` and runs every spec there
against three real device profiles (touch events, mobile viewport, device
pixel ratio) defined in `playwright.config.js`:

| Project         | Device       | Engine   | Covers                    |
| --------------- | ------------ | -------- | ------------------------- |
| `mobile-chrome` | Pixel 7      | Chromium | Android phones            |
| `mobile-safari` | iPhone 14    | WebKit   | iOS phones                |
| `tablet-safari` | iPad (gen 7) | WebKit   | Tablets / larger portrait |

Desktop specs in `tests/e2e/` are excluded from the device projects (several
set their own viewport sizes) and run under the `desktop` project.

## Running

```sh
npm run test:e2e            # everything: desktop + all mobile projects
npm run test:e2e:mobile     # the three device projects only
npm run test:e2e:desktop    # desktop project only
npx playwright test --project=mobile-safari tests/e2e/mobile/title-touch.spec.js
```

WebKit must be installed once per machine: `npx playwright install webkit`.
CI installs both engines (`.github/workflows/ci.yml`).

## What the suite verifies

- **`layout.spec.js`** — the canvas fits the viewport panel in both
  orientations, nothing overflows horizontally, the sidebar stacks below the
  game under the 980px breakpoint, sidebar panels stay reachable, and the
  Review Commands button meets the 44px touch-target guideline.
- **`title-touch.spec.js`** — every title flow works with real touch events
  (`touchstart`/`touchend`, not synthesized clicks): new game, continue,
  loading a slot from MANAGE SAVES, delete-all, and activating an item that
  was not preselected (no hover required). Also asserts the name input takes
  focus on tap (so the virtual keyboard opens) and uses a ≥16px font (so iOS
  Safari does not zoom the page on focus).
- **`orientation.spec.js`** — rotating on the title screen, mid-game, and
  with the name dialog open preserves state, refits the canvas, and keeps
  inputs usable.
- **`gameplay-touch.spec.js`** — taps on the play field are inert but safe
  (movement is deliberately keyboard-driven, per
  `design/mobile-web-strategy.md`), the flash-card review overlay is fully
  touch-operable, the first terminal challenge fits a phone screen and holds
  focus when it opens, and progress survives a reload.

## Tracked known failures

`title-touch.spec.js` contains one `test.fail()` entry: the title menu's
540×50 game-space hit zones scale down with the canvas to roughly 20px tall
on phones — well below the 44px Apple HIG / Material guideline. The test is
expected to fail; Playwright will flag it the moment the hit zones (or the
canvas scaling) are fixed, at which point the marker should be removed.

## Conventions

- Shared helpers live in `tests/e2e/mobile/helpers.js`; the game-space
  layout constants there mirror `src/game/scenes/TitleScene.js` — update
  both together.
- Interact through touch APIs (`page.touchscreen.tap`, `locator.tap()`)
  rather than `mouse.click` so tests exercise the same input path a phone
  user does.
- Assert on the `data-*` hooks exposed on `#game-root` / `#terminal-root` /
  `#review-root` rather than canvas pixels.
