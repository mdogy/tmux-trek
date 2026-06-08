# TMUX Trek — Software Engineering Practices Guide

> This is a broad engineering reference and includes aspirational examples. For the repository's implemented architecture, commands, tests, and immediate next task, read [Session Handoff](session-handoff.md). For the exact active delivery path, read [Delivery Workflow](delivery-workflow.md).

## Purpose

This document defines the complete software engineering methodology for building **TMUX Trek** in a robust, LLM-assisted, and collaboratively maintainable way. It covers Behavior-Driven Development (BDD), Test-Driven Development (TDD), Git discipline, GitHub issue tracking, the `gh` CLI workflow, and automated deployment to GitHub Pages. Every practice described here is designed to be directly executable by a developer or an LLM coding agent following this document as a skill file.

---

## 1. Repository Setup

### 1.1 Initialize the Repository

```bash
# Create and navigate to the project
mkdir tmux-trek && cd tmux-trek

# Initialize Git
git init
git branch -M main

# Create on GitHub using gh CLI
gh repo create tmux-trek \
  --public \
  --description "TMUX Trek: An educational sci-fi adventure game for learning tmux" \
  --homepage "https://YOUR_USERNAME.github.io/tmux-trek"

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/tmux-trek.git
git push -u origin main
```

### 1.2 Project Directory Structure

```
tmux-trek/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             # Run tests on every PR
│   │   └── deploy.yml         # Deploy to GitHub Pages on merge to main
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   ├── bug.md
│   │   └── bdd-scenario.md
│   └── pull_request_template.md
├── src/
│   ├── game/                  # Phaser 4 game world (scenes, sprites, tilemaps)
│   │   ├── scenes/
│   │   ├── entities/
│   │   └── systems/
│   ├── terminal/              # xterm.js + tmux state machine
│   │   ├── TmuxEmulator.js
│   │   ├── BashEmulator.js
│   │   └── TerminalRenderer.js
│   ├── engine/                # Pure logic: no DOM, no Phaser dependencies
│   │   ├── SessionManager.js
│   │   ├── WindowManager.js
│   │   ├── PaneManager.js
│   │   └── CopyModeEngine.js
│   └── data/
│       ├── zones/             # Zone configurations (JSON)
│       ├── commands/          # Command definitions and metadata
│       └── dialogue/          # NPC dialogue scripts
├── features/                  # BDD feature files (Gherkin .feature)
│   ├── sessions/
│   ├── windows/
│   ├── panes/
│   ├── copy-mode/
│   └── game-world/
├── tests/
│   ├── unit/                  # TDD unit tests (Vitest)
│   ├── integration/           # Integration tests
│   └── step-definitions/      # BDD step implementations
├── assets/
│   ├── tilesets/
│   ├── sprites/
│   └── audio/
├── dist/                      # Build output (gitignored)
├── index.html
├── vite.config.js
├── vitest.config.js
├── cucumber.config.js
├── package.json
└── README.md
```

### 1.3 Package Initialization and Dependencies

```bash
npm init -y

# Core game
npm install phaser@latest
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links

# WASM shell runtime
npm install @wasmer/wasi @wasmer/wapm

# Build tooling
npm install -D vite

# Testing: TDD
npm install -D vitest @vitest/ui jsdom happy-dom

# Testing: BDD
npm install -D @cucumber/cucumber jest-cucumber

# Code quality
npm install -D eslint prettier eslint-plugin-vitest

# Conventional commits enforcement
npm install -D commitlint @commitlint/config-conventional husky
```

---

## 2. Branching Strategy

TMUX Trek uses **GitHub Flow** — a lightweight, PR-driven model where `main` is always deployable. For structured version releases, an optional `develop` integration branch is used.[^1][^2]

For the current test deployment, the required path is:

1. Create an alternate branch from `main`.
2. Commit a small, reviewable change.
3. Push the branch and open a pull request targeting `main`.
4. Let GitHub Actions CI pass on the pull request.
5. Merge the pull request.
6. Let GitHub Pages deploy the updated `main` build.

The operational checklist lives in [Delivery Workflow](delivery-workflow.md).

### 2.1 Branch Types and Naming

| Branch Type  | Pattern                      | Example                      | Created From |
| ------------ | ---------------------------- | ---------------------------- | ------------ |
| Feature      | `feature/issue-N-short-desc` | `feature/12-session-manager` | `main`       |
| Bug fix      | `fix/issue-N-short-desc`     | `fix/34-pane-focus-crash`    | `main`       |
| BDD scenario | `bdd/issue-N-feature-name`   | `bdd/15-copy-mode-scenarios` | `main`       |
| Hotfix       | `hotfix/short-desc`          | `hotfix/deploy-path-wrong`   | `main`       |
| Release      | `release/vX.Y.Z`             | `release/v0.3.0`             | `main`       |

**Rules:**

- Branch names always reference the GitHub Issue number[^2]
- `main` is protected — direct pushes are forbidden
- All merges require a passing CI run
- Feature branches are deleted after merge

```bash
# Create a feature branch (always from fresh main)
git checkout main && git pull origin main
git checkout -b feature/12-session-manager

# When done — push and open PR
git push origin feature/12-session-manager
gh pr create \
  --title "feat(engine): implement SessionManager with attach/detach" \
  --body "Closes #12" \
  --label "feature" \
  --assignee "@me"
```

---

## 3. Commit Message Convention (Conventional Commits)

All commits use the [Conventional Commits](https://www.conventionalcommits.org) specification, enforced by `commitlint` and `husky`.[^1]

### 3.1 Format

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer: Closes #N, Breaking change notice]
```

### 3.2 Types

| Type       | When to Use                                         |
| ---------- | --------------------------------------------------- |
| `feat`     | New feature, new game mechanic, new command support |
| `fix`      | Bug fix                                             |
| `test`     | Adding or updating tests only                       |
| `bdd`      | Adding or updating BDD feature files                |
| `docs`     | Documentation changes                               |
| `refactor` | Code restructuring without behavior change          |
| `chore`    | Build tooling, dependencies, CI config              |
| `perf`     | Performance improvement                             |
| `style`    | Formatting, whitespace (no logic change)            |
| `revert`   | Reverts a previous commit                           |

### 3.3 Scope Values for TMUX Trek

`engine` · `terminal` · `game` · `panes` · `windows` · `sessions` · `copy-mode` · `config` · `ci` · `assets` · `docs`

### 3.4 Examples

```
feat(engine): add SessionManager with create, attach, detach, kill

Implements the full session lifecycle as a pure JS state machine.
No DOM dependencies — all methods receive/return plain objects.

Closes #12

---

fix(terminal): correct Ctrl+b prefix detection for rapid keypresses

The prefix handler was clearing state too early when the second key
arrived within the 500ms window on slow keyboards.

Closes #47

---

bdd(sessions): add Gherkin scenarios for detach-and-reattach persistence

Covers the core tmux mental model: a detached session must survive
and be reattachable. This is the most critical behavioral contract.

Closes #15
```

### 3.5 Enforce with Husky + Commitlint

```bash
npx husky init
echo "npx commitlint --edit \$1" > .husky/commit-msg
```

```js
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "engine",
        "terminal",
        "game",
        "panes",
        "windows",
        "sessions",
        "copy-mode",
        "config",
        "ci",
        "assets",
        "docs",
      ],
    ],
    "subject-max-length": [2, "always", 72],
  },
};
```

---

## 4. GitHub Issues — The Canonical Unit of Work

Every piece of work — feature, bug, BDD scenario, documentation — begins as a GitHub Issue. No branch is created without an issue. No PR is opened without a `Closes #N` reference.[^3]

### 4.1 Issue Labels

Create these labels in the repository:

```bash
gh label create "feature"       --color "0075ca" --description "New feature or mechanic"
gh label create "bug"           --color "d73a4a" --description "Something is broken"
gh label create "bdd"           --color "e4e669" --description "BDD feature file or scenario"
gh label create "tdd"           --color "cfd3d7" --description "Unit test or TDD cycle"
gh label create "act-1"         --color "0e8a16" --description "Sessions act"
gh label create "act-2"         --color "006b75" --description "Windows act"
gh label create "act-3"         --color "5319e7" --description "Panes act"
gh label create "act-4"         --color "e11d48" --description "Copy mode & config act"
gh label create "engine"        --color "1d76db" --description "Pure game logic layer"
gh label create "terminal"      --color "f9d0c4" --description "xterm.js / tmux emulator"
gh label create "phaser"        --color "b60205" --description "Phaser 4 game world"
gh label create "ci/cd"         --color "cccccc" --description "GitHub Actions, deployment"
gh label create "blocked"       --color "e4e669" --description "Waiting on another issue"
```

### 4.2 Issue Templates

**`.github/ISSUE_TEMPLATE/feature.md`**

```markdown
---
name: Feature
about: A new game mechanic, system, or capability
labels: feature
---

## Summary

<!-- One sentence: what does this add to the game? -->

## Acceptance Criteria

<!-- These become BDD scenarios in features/ -->

- [ ] Given ... When ... Then ...
- [ ] Given ... When ... Then ...

## Implementation Notes

<!-- Relevant files, dependencies, data structures -->

## Linked Issues

<!-- Closes #N, Depends on #N -->
```

**`.github/ISSUE_TEMPLATE/bdd-scenario.md`**

````markdown
---
name: BDD Scenario
about: Define behavioral contracts as Gherkin scenarios
labels: bdd
---

## Feature File

`features/<area>/<name>.feature`

## Scenarios to Define

```gherkin
Feature: <feature name>

  Scenario: <scenario name>
    Given ...
    When ...
    Then ...
```
````

## Step Definitions to Implement

`tests/step-definitions/<name>.steps.js`

````
### 4.3 Issue Milestones
Create milestones that map to game acts:

```bash
gh api repos/:owner/:repo/milestones --method POST \
  -f title="Act 1 - Sessions" \
  -f description="Zones 1-3: tmux session commands" \
  -f due_on="2024-04-01T00:00:00Z"

gh api repos/:owner/:repo/milestones --method POST \
  -f title="Act 2 - Windows" \
  -f description="Zones 4-6: tmux window commands"

gh api repos/:owner/:repo/milestones --method POST \
  -f title="Act 3 - Panes" \
  -f description="Zones 7-10: pane splits, navigation, copy mode"

gh api repos/:owner/:repo/milestones --method POST \
  -f title="Act 4 - Copy Mode & Config" \
  -f description="Zones 11-13: copy mode, keybindings, .tmux.conf"

gh api repos/:owner/:repo/milestones --method POST \
  -f title="Infrastructure" \
  -f description="CI/CD, build system, deployment, testing framework"
````

### 4.4 The gh Issue Workflow (Daily Developer Loop)

```bash
# Create a feature issue
gh issue create \
  --title "feat(engine): implement SessionManager" \
  --body-file .github/ISSUE_TEMPLATE/feature.md \
  --label "feature,engine,act-1" \
  --milestone "Act 1 - Sessions" \
  --assignee "@me"

# View all open act-1 issues
gh issue list --label "act-1" --state open

# Start work — create branch referencing issue
gh issue develop 12 --checkout
# (This creates branch issue-12 and checks it out — or do it manually:)
git checkout -b feature/12-session-manager

# View issue while working
gh issue view 12

# Close issue via PR
gh pr create --title "feat(engine): SessionManager" --body "Closes #12"
```

---

## 5. Behavior-Driven Development (BDD)

BDD in TMUX Trek defines the **behavioral contracts** of the tmux emulator, the game world logic, and the puzzle system in human-readable Gherkin syntax. BDD scenarios become the acceptance tests — if a scenario passes, the feature is done.[^4]

The BDD framework is **Cucumber.js** (`@cucumber/cucumber`) running via `jest-cucumber` for Vitest integration.[^5][^6]

### 5.1 BDD Philosophy for TMUX Trek

The key architectural decision that makes TMUX Trek testable is the **strict separation of pure engine logic from rendering**:[^7]

- `src/engine/` — pure JavaScript, no DOM, no Phaser, no xterm.js. Input: plain objects. Output: plain objects.
- `src/terminal/` — wraps the engine, connects to xterm.js rendering
- `src/game/` — Phaser scenes that call the engine

BDD tests operate only against `src/engine/`. The engine is a deterministic state machine.[^8]

### 5.2 Feature File Organization

```
features/
├── sessions/
│   ├── create-session.feature
│   ├── attach-detach.feature
│   ├── list-sessions.feature
│   └── kill-session.feature
├── windows/
│   ├── create-window.feature
│   ├── navigate-windows.feature
│   ├── rename-kill-window.feature
│   └── window-list.feature
├── panes/
│   ├── split-panes.feature
│   ├── navigate-panes.feature
│   ├── zoom-kill-pane.feature
│   └── swap-layout-panes.feature
├── copy-mode/
│   ├── enter-exit-copy-mode.feature
│   ├── navigate-scrollback.feature
│   └── copy-paste-buffer.feature
└── game-world/
    ├── command-collection.feature
    ├── zone-unlock.feature
    └── helix-hint-system.feature
```

### 5.3 BDD Feature File Examples

**`features/sessions/attach-detach.feature`**

```gherkin
Feature: Session persistence across detach and reattach
  As a player learning tmux
  I want detached sessions to persist
  So that I understand the core tmux mental model

  Background:
    Given the tmux emulator is initialized
    And no sessions exist

  Scenario: A session persists after detach
    Given a session named "clulix" is created
    And the session "clulix" is the active session
    When the player executes "Ctrl+b d"
    Then the session "clulix" should be in a detached state
    And the session "clulix" should still exist in the session list
    And no session should be active

  Scenario: A detached session can be reattached
    Given a detached session named "clulix" exists
    When the player executes "tmux attach -t clulix"
    Then the session "clulix" should be the active session
    And the session "clulix" should be in an attached state

  Scenario: Killing a session removes it permanently
    Given an attached session named "clulix" exists
    When the player executes "tmux kill-session -t clulix"
    Then the session "clulix" should not exist in the session list
    And no session should be active

  Scenario: Player cannot attach a non-existent session
    Given no sessions exist
    When the player executes "tmux attach -t ghost"
    Then an error message "no session named ghost" should be displayed
```

**`features/panes/split-panes.feature`**

```gherkin
Feature: Splitting panes in a window
  As a player learning pane management
  I want to split a window into multiple panes
  So that I can monitor multiple things simultaneously

  Background:
    Given the tmux emulator is initialized
    And a session named "clulix" is active
    And window 0 is active with 1 pane

  Scenario: Vertical split creates a left and right pane
    When the player executes "Ctrl+b %"
    Then window 0 should have 2 panes
    And the pane layout should be "vertical-split"
    And the right pane should be the active pane

  Scenario: Horizontal split creates a top and bottom pane
    When the player executes "Ctrl+b \""
    Then window 0 should have 2 panes
    And the pane layout should be "horizontal-split"
    And the bottom pane should be the active pane

  Scenario: Pane navigation with arrow keys
    Given window 0 has a vertical split with left pane active
    When the player executes "Ctrl+b →"
    Then the right pane should be the active pane

  Scenario: Zoom toggles pane to full window size
    Given window 0 has 2 panes with pane 0 active
    When the player executes "Ctrl+b z"
    Then pane 0 should be in zoomed state
    And the zoomed pane should occupy the full window area
    When the player executes "Ctrl+b z"
    Then pane 0 should not be in zoomed state
```

**`features/game-world/command-collection.feature`**

```gherkin
Feature: Command glyph collection unlocks gameplay
  As a player
  I want to collect command glyphs in the world
  So that I unlock tmux commands and can progress through zones

  Background:
    Given the player has no collected commands
    And the player is in Zone 1

  Scenario: Collecting a command glyph adds it to inventory
    Given the "tmux new -s" command glyph is present at tile (5, 3)
    When the player moves to tile (5, 3)
    Then the player's command inventory should contain "tmux new -s"
    And a collection animation should play

  Scenario: Using an uncollected command is blocked
    Given the player has not collected "Ctrl+b %"
    When the player attempts to execute "Ctrl+b %"
    Then the terminal should display "Command not yet unlocked"
    And a hint should direct the player to find the glyph

  Scenario: Collecting a command unlocks a blocked tile
    Given a force-field tile at (10, 8) requires "tmux new -s"
    And the player has collected "tmux new -s"
    When the player approaches tile (10, 8)
    Then the force-field tile should become passable
```

### 5.4 Step Definition Implementation

**`tests/step-definitions/sessions.steps.js`**

```javascript
import { Given, When, Then, Before } from "@cucumber/cucumber";
import { expect } from "vitest";
import { TmuxEngine } from "../../src/engine/TmuxEngine.js";

let engine;

Before(() => {
  engine = new TmuxEngine();
});

Given("the tmux emulator is initialized", () => {
  expect(engine).toBeDefined();
  expect(engine.getSessions()).toHaveLength(0);
});

Given("no sessions exist", () => {
  engine.reset();
});

Given("a session named {string} is created", (name) => {
  engine.createSession(name);
});

Given("the session {string} is the active session", (name) => {
  engine.attachSession(name);
});

When("the player executes {string}", (command) => {
  engine.handleInput(command);
});

Then("the session {string} should be in a detached state", (name) => {
  const session = engine.getSession(name);
  expect(session).toBeDefined();
  expect(session.attached).toBe(false);
});

Then("the session {string} should still exist in the session list", (name) => {
  expect(engine.getSession(name)).toBeDefined();
});

Then("no session should be active", () => {
  expect(engine.getActiveSession()).toBeNull();
});

Then("the session {string} should be the active session", (name) => {
  const active = engine.getActiveSession();
  expect(active?.name).toBe(name);
});

Then("an error message {string} should be displayed", (msg) => {
  expect(engine.getLastError()).toContain(msg);
});
```

### 5.5 Cucumber Configuration

```javascript
// cucumber.config.js
export default {
  default: {
    require: ["tests/step-definitions/**/*.steps.js"],
    format: ["progress-bar", "html:reports/cucumber.html"],
    paths: ["features/**/*.feature"],
    publishQuiet: true,
  },
};
```

```json
// package.json scripts
{
  "scripts": {
    "bdd": "cucumber-js",
    "bdd:watch": "cucumber-js --watch",
    "bdd:report": "cucumber-js --format html:reports/cucumber.html"
  }
}
```

---

## 6. Test-Driven Development (TDD)

TDD governs the implementation of all engine logic in `src/engine/`. The cycle is Red → Green → Refactor. No production logic is written in `src/engine/` without a failing test first.[^7][^8]

The test runner is **Vitest** — chosen over Jest because of native ESM support, Vite integration (same config as the build), and faster watch mode that reruns only affected tests.[^9]

### 6.1 Vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // Engine tests: pure Node, no DOM
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**"],
      exclude: ["src/game/**", "src/terminal/**"],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
      reporter: ["text", "html", "lcov"],
    },
    globals: true,
  },
});
```

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 6.2 TDD Cycle for Engine Components

**The Rule:** Every method in `src/engine/` must be written in this order:

1. Write a failing unit test
2. Write the minimum code to make it pass
3. Refactor for clarity — tests must still pass

```javascript
// tests/unit/engine/SessionManager.test.js

import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager } from "../../../src/engine/SessionManager.js";

describe("SessionManager", () => {
  let sm;

  beforeEach(() => {
    sm = new SessionManager();
  });

  describe("createSession", () => {
    it("creates a session with the given name", () => {
      sm.createSession("clulix");
      expect(sm.getSession("clulix")).toBeDefined();
    });

    it("assigns auto-incrementing numeric index when no name given", () => {
      sm.createSession();
      expect(sm.getSession("0")).toBeDefined();
    });

    it("throws when a session with that name already exists", () => {
      sm.createSession("clulix");
      expect(() => sm.createSession("clulix")).toThrow(
        "duplicate session name",
      );
    });

    it("new session starts with one window (window 0)", () => {
      sm.createSession("clulix");
      const session = sm.getSession("clulix");
      expect(session.windows).toHaveLength(1);
      expect(session.windows.index).toBe(0);
    });
  });

  describe("attachSession / detachSession", () => {
    it("marks session as attached and sets it as active", () => {
      sm.createSession("clulix");
      sm.attachSession("clulix");
      expect(sm.getActiveSession()?.name).toBe("clulix");
      expect(sm.getSession("clulix").attached).toBe(true);
    });

    it("detaching makes session persist but inactive", () => {
      sm.createSession("clulix");
      sm.attachSession("clulix");
      sm.detachSession();
      expect(sm.getSession("clulix")).toBeDefined();
      expect(sm.getActiveSession()).toBeNull();
    });

    it("throws when attaching a non-existent session", () => {
      expect(() => sm.attachSession("ghost")).toThrow("no session named ghost");
    });
  });

  describe("listSessions", () => {
    it("returns empty array when no sessions exist", () => {
      expect(sm.listSessions()).toEqual([]);
    });

    it("returns all sessions with their attached state", () => {
      sm.createSession("alpha");
      sm.createSession("beta");
      sm.attachSession("alpha");
      const list = sm.listSessions();
      expect(list).toHaveLength(2);
      expect(list.find((s) => s.name === "alpha").attached).toBe(true);
      expect(list.find((s) => s.name === "beta").attached).toBe(false);
    });
  });

  describe("killSession", () => {
    it("removes the session from the manager", () => {
      sm.createSession("clulix");
      sm.killSession("clulix");
      expect(sm.getSession("clulix")).toBeUndefined();
    });

    it("throws when killing a non-existent session", () => {
      expect(() => sm.killSession("ghost")).toThrow("no session named ghost");
    });
  });
});
```

```javascript
// tests/unit/engine/PaneManager.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PaneManager } from '../../../src/engine/PaneManager.js';

describe('PaneManager', () => {

  let pm;

  beforeEach(() => {
    pm = new PaneManager();
  });

  describe('splitVertical', () => {
    it('creates 2 panes from 1 initial pane', () => {
      pm.initWindow(100, 40); // width, height
      pm.splitVertical();
      expect(pm.getPanes()).toHaveLength(2);
    });

    it('new right pane becomes active after vertical split', () => {
      pm.initWindow(100, 40);
      pm.splitVertical();
      expect(pm.getActivePane().position).toBe('right');
    });

    it('left and right panes share available width equally', () => {
      pm.initWindow(100, 40);
      pm.splitVertical();
      const panes = pm.getPanes();
      expect(panes.width).toBe(50);
      expect(panes[^1].width).toBe(50);
    });
  });

  describe('zoom', () => {
    it('zoom marks the active pane as zoomed', () => {
      pm.initWindow(100, 40);
      pm.splitVertical();
      pm.zoom();
      expect(pm.getActivePane().zoomed).toBe(true);
    });

    it('zoom is a toggle — second call unzooms', () => {
      pm.initWindow(100, 40);
      pm.splitVertical();
      pm.zoom();
      pm.zoom();
      expect(pm.getActivePane().zoomed).toBe(false);
    });
  });

  describe('navigateToPane', () => {
    it('navigates right from left pane in vertical split', () => {
      pm.initWindow(100, 40);
      pm.splitVertical();
      pm.navigateTo('left');         // go back to left
      pm.navigateDirection('right'); // navigate right
      expect(pm.getActivePane().position).toBe('right');
    });
  });
});
```

### 6.3 TDD for Copy Mode Engine

Copy mode is the most complex engine component and the highest-value TDD target.[^8]

```javascript
// tests/unit/engine/CopyModeEngine.test.js

import { describe, it, expect, beforeEach } from "vitest";
import { CopyModeEngine } from "../../../src/engine/CopyModeEngine.js";

const SAMPLE_BUFFER = [
  "Line 0: CLULIX systems online",
  "Line 1: Session established",
  "Line 2: WARNING: launch code required",
  "Line 3: Code: ZRIX-7734-ALPHA",
  "Line 4: End of log",
];

describe("CopyModeEngine", () => {
  let cme;

  beforeEach(() => {
    cme = new CopyModeEngine(SAMPLE_BUFFER);
  });

  describe("entry and exit", () => {
    it("starts in normal mode (not copy mode)", () => {
      expect(cme.isActive()).toBe(false);
    });

    it("activates on enter()", () => {
      cme.enter();
      expect(cme.isActive()).toBe(true);
    });

    it("cursor starts at last line on entry", () => {
      cme.enter();
      expect(cme.getCursorLine()).toBe(4);
    });

    it("q exits copy mode", () => {
      cme.enter();
      cme.handleKey("q");
      expect(cme.isActive()).toBe(false);
    });
  });

  describe("vim navigation", () => {
    beforeEach(() => cme.enter());

    it("k moves cursor up one line", () => {
      cme.handleKey("k");
      expect(cme.getCursorLine()).toBe(3);
    });

    it("j moves cursor down (does not go below last line)", () => {
      cme.handleKey("k");
      cme.handleKey("j");
      expect(cme.getCursorLine()).toBe(4);
    });

    it("g jumps to first line", () => {
      cme.handleKey("g");
      expect(cme.getCursorLine()).toBe(0);
    });

    it("G jumps to last line", () => {
      cme.handleKey("g"); // go to top first
      cme.handleKey("G");
      expect(cme.getCursorLine()).toBe(4);
    });

    it("w moves cursor forward one word", () => {
      cme.handleKey("g"); // line 0: "Line 0: CLULIX systems online"
      const colBefore = cme.getCursorCol();
      cme.handleKey("w");
      expect(cme.getCursorCol()).toBeGreaterThan(colBefore);
    });
  });

  describe("selection and copy", () => {
    beforeEach(() => cme.enter());

    it("Space starts a selection at cursor position", () => {
      cme.handleKey("g"); // go to line 0
      cme.handleKey("Space");
      expect(cme.isSelecting()).toBe(true);
      expect(cme.getSelectionStart()).toEqual({ line: 0, col: 0 });
    });

    it("Enter copies selected text to buffer", () => {
      cme.handleKey("g");
      cme.handleKey("Space");
      cme.handleKey("w");
      cme.handleKey("w"); // select 2 words
      cme.handleKey("Enter");
      expect(cme.getBuffer(0)).toContain("Line");
      expect(cme.isSelecting()).toBe(false);
    });

    it("multiple copies populate indexed buffers", () => {
      // Copy buffer 0
      cme.handleKey("g");
      cme.handleKey("Space");
      cme.handleKey("w");
      cme.handleKey("Enter");
      // Copy buffer 1
      cme.handleKey("j");
      cme.handleKey("Space");
      cme.handleKey("w");
      cme.handleKey("Enter");
      expect(cme.getBufferCount()).toBe(2);
    });
  });
});
```

### 6.4 What NOT to Unit Test

Following the principle of not testing the framework:[^8]

- Do NOT unit test Phaser scene rendering, sprite positions, or animation playback — these are Phaser's responsibility
- Do NOT unit test xterm.js terminal rendering output
- Do NOT unit test that a DOM element has focus
- **DO** unit test every method in `src/engine/` — the state machine logic is entirely yours

---

## 7. CI/CD Pipeline

### 7.1 CI Workflow — Run Tests on Every PR

**`.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TDD unit tests
        run: npm run test:coverage

      - name: Run BDD scenarios
        run: npm run bdd

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          file: coverage/lcov.info
          fail_ci_if_error: false

      - name: Upload BDD report
        uses: actions/upload-artifact@v4
        with:
          name: cucumber-report
          path: reports/cucumber.html
```

### 7.2 Deploy Workflow — GitHub Pages on Merge to Main

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build with Vite
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    name: Deploy
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 7.3 Vite Build Configuration

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  base: "/tmux-trek/", // Must match the GitHub repo name
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### 7.4 Enable GitHub Pages

```bash
# Configure GitHub Pages source to GitHub Actions
gh api repos/:owner/:repo/pages \
  --method POST \
  -f source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || true

# Better: use UI — Settings > Pages > Source: GitHub Actions
# Then verify deployment
gh run list --workflow=deploy.yml
```

---

## 8. Pull Request Process

### 8.1 PR Template

**`.github/pull_request_template.md`**

````markdown
## Summary

<!-- What does this PR do? Link to the issue. -->

Closes #

## Type of Change

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `test` — Tests only (TDD unit or BDD scenario)
- [ ] `refactor` — No behavior change
- [ ] `chore` — Build, CI, dependencies

## Changes Made

<!-- Bullet list of files changed and why -->

## Test Evidence

- [ ] Unit tests added/updated in `tests/unit/`
- [ ] BDD scenarios added/updated in `features/`
- [ ] All existing tests pass (`npm test`)
- [ ] BDD suite passes (`npm run bdd`)

## BDD Scenarios Covered

<!-- Paste the Gherkin scenarios this PR satisfies -->

`Given ...`

## Checklist

- [ ] Conventional commit message format used
- [ ] Branch named `type/issue-N-description`
- [ ] No direct changes to `src/game/` from engine-only PRs
- [ ] Coverage thresholds maintained (≥90% lines on `src/engine/`)
````

### 8.2 Merge Strategy

- **Squash merge** for feature branches — keeps `main` history clean
- **Merge commit** for release branches — preserves release boundary
- Never force-push to `main`

```bash
# Merge a PR with squash via gh CLI
gh pr merge 34 --squash --delete-branch
```

---

## 9. Documentation Standards

### 9.1 README Structure

The `README.md` must always be current and contain:

1. **Project badge row** — CI status, coverage, license
2. **One-line description** — what TMUX Trek is
3. **Quick start** — `npm install && npm run dev`
4. **Development guide** — TDD cycle, BDD cycle, branching
5. **Architecture overview** — the three-layer diagram (engine / terminal / game)
6. **Deployment** — how to deploy, live URL

```bash
# Add status badges to README (replace YOUR_USERNAME)
cat >> README.md << 'EOF'
![CI](https://github.com/YOUR_USERNAME/tmux-trek/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/tmux-trek/actions/workflows/deploy.yml/badge.svg)
EOF
```

### 9.2 JSDoc for Engine Layer

Every public method in `src/engine/` must have JSDoc. The engine is the shared contract between the game, terminal, and tests.

```javascript
/**
 * Creates a new tmux session.
 *
 * @param {string} [name] - Session name. If omitted, uses next available integer.
 * @returns {{ name: string, index: number, windows: Window[], attached: boolean }}
 * @throws {Error} If a session with the given name already exists.
 *
 * @example
 * const sm = new SessionManager();
 * sm.createSession('clulix');
 * // => { name: 'clulix', index: 0, windows: [...], attached: false }
 */
createSession(name) { ... }
```

### 9.3 Feature File Comments

BDD feature files serve as living documentation. They must be written first, before implementation, and must be comprehensible without code context. Each scenario title must be a complete statement of the expected behavior.

---

## 10. LLM-Assisted Development Workflow

When using an LLM coding agent to implement TMUX Trek, the following workflow ensures robust, testable output:

### 10.1 Issue-First Prompting

Always start a coding session by providing the GitHub Issue number and the relevant BDD feature file. The LLM's job is to make the BDD scenarios pass, nothing more.

```
Implement the TmuxEngine.handleInput() method so that the following
BDD scenarios pass: [paste features/sessions/attach-detach.feature]

Constraints:
- Only modify files in src/engine/
- Do not import Phaser, xterm, or any DOM library
- All methods must be pure: input objects in, output objects out
- Write TDD unit tests in tests/unit/engine/ first (Red), then implement (Green)
- Follow the commit convention: feat(engine): <description>
```

### 10.2 The LLM Red-Green-Refactor Loop

```
STEP 1 (Red): Write the failing tests.
  - Run: npm test → all new tests should FAIL
  - Commit: test(engine): add failing tests for SessionManager.createSession

STEP 2 (Green): Write minimum implementation.
  - Run: npm test → all tests should PASS
  - Commit: feat(engine): implement SessionManager.createSession

STEP 3 (Refactor): Clean the code.
  - Run: npm test → still PASS
  - Commit: refactor(engine): simplify session indexing logic

STEP 4 (BDD): Connect to feature file.
  - Implement step definitions in tests/step-definitions/
  - Run: npm run bdd → BDD scenarios should PASS
  - Commit: bdd(sessions): implement attach-detach step definitions
```

### 10.3 Coverage Gates

The CI pipeline enforces ≥90% line coverage on `src/engine/`. An LLM PR that drops coverage below the threshold will fail CI and cannot be merged. This prevents the common failure mode of implementation without tests.

### 10.4 Issue Tracking Commands for LLM Agent

```bash
# List current sprint issues
gh issue list --milestone "Act 1 - Sessions" --state open

# Pick up an issue
gh issue develop 12 --checkout

# Mark an issue in progress
gh issue edit 12 --add-label "in-progress"

# Close issue via PR
gh pr create --title "feat(engine): SessionManager" --body "Closes #12" --label "feature,act-1"

# After merge, confirm issue closed
gh issue view 12  # Should show "closed"
```

---

## 11. Development Environment Setup (One-Time)

```bash
# Clone the repo
gh repo clone YOUR_USERNAME/tmux-trek
cd tmux-trek

# Install dependencies
npm install

# Set up husky pre-commit hooks
npm run prepare

# Verify the full stack
npm run test          # TDD: should show 0 tests (empty), exit 0
npm run bdd           # BDD: should show 0 scenarios, exit 0
npm run build         # Vite build: should produce dist/
npm run dev           # Dev server: http://localhost:3000

# Verify gh CLI is authenticated
gh auth status

# Verify CI is configured
gh workflow list
# Should show: CI, Deploy to GitHub Pages
```

---

## 12. Quality Gates Summary

| Gate                       | Tool                     | Threshold                 | Enforced By     |
| -------------------------- | ------------------------ | ------------------------- | --------------- |
| Commit format              | commitlint + husky       | 100% conventional commits | Pre-commit hook |
| Unit test pass             | Vitest                   | 100% of tests             | CI workflow     |
| Engine coverage (lines)    | Vitest + v8              | ≥ 90%                     | CI workflow     |
| Engine coverage (branches) | Vitest + v8              | ≥ 85%                     | CI workflow     |
| BDD scenario pass          | Cucumber.js              | 100% of scenarios         | CI workflow     |
| Lint                       | ESLint                   | 0 errors                  | CI workflow     |
| Build                      | Vite                     | Exit 0                    | Deploy workflow |
| PR merge                   | GitHub branch protection | Requires CI pass          | Branch rules    |
| Direct main push           | GitHub branch protection | Forbidden                 | Branch rules    |

---

## References

1. [Git & PR Strategy - Introduction - Compunart docs](https://docs.compunart.com/internal/git-and-pr-strategy) - Nextra: the next docs builder

2. [Branching Strategies, Policies and Standards](https://guidance.cabinetoffice.gov.uk/digital-handbook/docs/guidance/software/branching-strategies-policies-standards.html)

3. [gh issue create - GitHub CLI](https://cli.github.com/manual/gh_issue_create) - Take GitHub to the command line

4. [Behaviour-Driven Development | Cucumber](https://cucumber.io/docs/bdd/) - Behaviour-Driven Development (BDD) is the software development process that Cucumber was built to su...

5. [Getting Started with Cucumber.js | The Behavior-Driven Testing ...](https://dev.to/keploy/getting-started-with-cucumberjs-the-behavior-driven-testing-framework-for-javascript-4a0) - Best Practices for Cucumber.js. Keep scenarios short and clear — each scenario should test one behav...

6. [BDD Fundamentals with Jest And Cucumber | Mayallo](https://mayallo.com/bdd-fundamentals-jest-cucumber-nodejs/) - Learn how Jest-Cucumber combines Jest’s testing power with Cucumber’s BDD approach, covering core co...

7. [Guidelines, best practice and Testing Template - Phaser 3](https://phaser.discourse.group/t/guidelines-best-practice-and-testing-template/10914) - I’m new too Phaser, but I was a developer for many year’s, I was tinkering with phaser for a while n...

8. [Testing Phaser Games with Vitest - DEV Community](https://dev.to/davidmorais/testing-phaser-games-with-vitest-3kon) - Introduction As you may know, I am currently developing my own solo indie game, it's...

9. [Getting started with Vitest](https://www.speakeasy.com/blog/vitest-vs-jest) - A comparison of Jest and Vitest in terms of their features, performance, and developer experience to...
