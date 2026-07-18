import { defineConfig, devices } from "@playwright/test";

// The mobile suite runs against real device profiles (touch events, mobile
// viewport, device pixel ratio). Desktop specs keep the wide viewport and
// are excluded from the device projects because several set their own
// viewport sizes.
const MOBILE_TESTS = /tests[/\\]e2e[/\\]mobile[/\\].*\.spec\.js/;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: MOBILE_TESTS,
      use: {
        viewport: {
          width: 1440,
          height: 1100,
        },
      },
    },
    {
      name: "mobile-chrome",
      testMatch: MOBILE_TESTS,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      testMatch: MOBILE_TESTS,
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "tablet-safari",
      testMatch: MOBILE_TESTS,
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
  webServer: {
    // Serve a production build. The dev server's HMR client can drop its
    // WebSocket while a cold server finishes dependency bundling, and the
    // reconnect forces a page reload that resets the game mid-test.
    // A running `npm run dev` on the same port is still reused for local
    // iteration via reuseExistingServer.
    command:
      "npm run build -- --base=/ && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
