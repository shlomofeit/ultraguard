import express from "express";
import path from "node:path";

const DIST_PATH = path.resolve("dist");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use(express.static(DIST_PATH));

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

export default app;
