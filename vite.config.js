import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/tmux-trek/" : "/",
  server: {
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
}));
