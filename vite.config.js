import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
