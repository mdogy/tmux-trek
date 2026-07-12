import { defineConfig } from "@playwright/test";

const useExistingServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1";

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
  webServer: useExistingServer
    ? undefined
    : {
        // Production build, same as playwright.config.js: the dev server's
        // HMR client can force a mid-recording page reload on cold start.
        command:
          "npm run build -- --base=/ && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: true,
        timeout: 60_000,
      },
  // Serial execution ensures clips are written in test-order so Python can
  // sort by mtime to reconstruct the intended sequence.
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/demo/results.json" }],
  ],
});
