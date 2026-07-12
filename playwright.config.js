import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: {
      width: 1440,
      height: 1100,
    },
  },
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
