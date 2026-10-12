import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

const BACKEND_URL = "http://localhost:3000";

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    proxy: {
      "/api": BACKEND_URL,
      "/socket.io": { target: BACKEND_URL, ws: true },
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
