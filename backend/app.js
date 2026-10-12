import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { router as authRouter } from "./routes/auth.routes.js";
import { router as eventsRouter } from "./routes/events.routes.js";
import { router as roomsRouter } from "./routes/rooms.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.CLIENT_ORIGIN }));
app.use(helmet());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/rooms", roomsRouter);

app.use((req, res) => {
  res
    .status(404)
    .json({ message: `${req.url} doesn't have ${req.method} method!` });
});

app.use(errorHandler);

export default app;
