import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/demo",
  outputDir: "test-results/demo",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 960, height: 720 },
    // Playwright's test runner honours the `video` key (not `recordVideo`);
    // videos land in each test's outputDir as video.webm.
    video: "on",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
  // Serial execution ensures clips are written in test-order so Python can
  // sort by mtime to reconstruct the intended sequence.
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/demo/results.json" }],
  ],
});
