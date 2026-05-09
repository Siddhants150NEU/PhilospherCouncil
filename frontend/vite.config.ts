import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During development, proxy all /api/* requests to the backend
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Raise the chunk warning threshold slightly — the philosopher prompts
    // are large string literals that push the bundle over the default 500kB.
    chunkSizeWarningLimit: 1200,
  },
});
