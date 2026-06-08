# TMUX Trek Delivery Workflow

TMUX Trek deploys its test build through GitHub Pages from `main`.

Current live URL: <https://mdogy.github.io/tmux-trek/>
Current-state handoff: [session-handoff.md](session-handoff.md)

Canonical delivery path:

1. Start from current `main`.
2. Create an alternate branch, using `codex/<short-description>` for agent work.
3. Commit a small, reviewable change with a Conventional Commit message.
4. Push the branch and open a pull request targeting `main`.
5. Let GitHub Actions run CI on the pull request.
6. Merge only after CI passes.
7. Let the `Deploy` workflow publish `main` to GitHub Pages.
8. Verify the deployed page at <https://mdogy.github.io/tmux-trek/>.
9. Update `history.md`, `TODO.md`, and `doc/session-handoff.md` when the change alters the resume state.

## Local Checks

Run these before pushing when feasible:

```bash
npm run lint
npm run test
npm run test:e2e
npm run bdd
npm run build
```

`npm run test:e2e` requires the Playwright Chromium browser. Install it with:

```bash
npx playwright install chromium
```

## GitHub Actions

- `.github/workflows/ci.yml` runs on pull requests to `main` and verifies lint,
  unit tests, browser acceptance tests, BDD, and production build.
- `.github/workflows/deploy.yml` runs after merges to `main` and publishes
  `dist/` to GitHub Pages.

Do not push directly to `main` for ordinary work. The pull request is the gate
that proves the game is still runnable before the test build changes.

## Handoff Requirements

A gameplay PR is not fully handed off until its documentation states:

- what the player can now do
- which engine commands/keybindings were added or changed
- which tests prove the flow
- any known limitations or intentionally deferred work
- the highest-value next task if priorities changed
