import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const SERVER_URL = "http://localhost:3000";

export default defineConfig({
  root: "public",
  publicDir: "static",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": SERVER_URL,
      "/socket.io": { target: SERVER_URL, ws: true },
    },
  },
});
