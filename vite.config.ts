import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force Cartesia SDK to use native browser WebSocket instead of Node.js ws
      ws: path.resolve(__dirname, "src/lib/ws-browser-shim.cjs"),
      // Stub Node.js stream for Cartesia backcompat modules
      stream: path.resolve(__dirname, "src/lib/stream-browser-shim.cjs"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        ...(mode !== "production"
          ? { "ui-kit": path.resolve(__dirname, "ui-kit.html") }
          : {}),
      },
    },
  },
}));
