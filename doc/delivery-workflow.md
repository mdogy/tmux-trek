# TMUX Trek Delivery Workflow

TMUX Trek deploys its test build through GitHub Pages from `main`.

Canonical delivery path:

1. Start from current `main`.
2. Create an alternate branch, using `codex/<short-description>` for agent work.
3. Commit a small, reviewable change with a Conventional Commit message.
4. Push the branch and open a pull request targeting `main`.
5. Let GitHub Actions run CI on the pull request.
6. Merge only after CI passes.
7. Let the `Deploy` workflow publish `main` to GitHub Pages.
8. Verify the deployed page at <https://mdogy.github.io/tmux-trek/>.

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
