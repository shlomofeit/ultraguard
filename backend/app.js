import { fileURLToPath } from "node:url";
import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { router as authRouter } from "./routes/auth.routes.js";
import { router as devicesRouter } from "./routes/devices.routes.js";
import { router as eventsRouter } from "./routes/events.routes.js";
import { router as roomsRouter } from "./routes/rooms.routes.js";
import { router as usersRouter } from "./routes/users.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.CLIENT_ORIGIN }));
app.use(helmet({ contentSecurityPolicy: false }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/events", eventsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/users", usersRouter);

app.use("/api", (req, res) => {
  res
    .status(404)
    .json({ message: `${req.url} doesn't have ${req.method} method!` });
});

if (process.env.NODE_ENV === "production") {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const clientDir = path.join(dir, "public");
  app.use(express.static(clientDir));
  app.use((req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

app.use(errorHandler);

export default app;
