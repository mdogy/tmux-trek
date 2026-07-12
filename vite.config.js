import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/tmux-trek/" : "/",
  // Pre-bundle every runtime dependency at dev-server start so a page
  // loaded seconds after startup doesn't hit mid-session optimizer churn.
  optimizeDeps: {
    include: [
      "phaser",
      "@xterm/xterm",
      "@xterm/addon-fit",
      "@xterm/addon-web-links",
    ],
  },
  server: {
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
}));
