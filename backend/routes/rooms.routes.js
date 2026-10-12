import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { roomsService } from "../services/rooms.service.js";

export const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const rooms = await roomsService.getRooms(req.user);

  res.json(rooms);
});

router.post("/", adminMiddleware, async (req, res) => {
  const room = await roomsService.createRoom(req.body);

  res.status(201).json(room);
});

router.patch("/:id", adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const room = await roomsService.updateRoom(id, req.body);

  res.json(room);
});

router.delete("/:id", adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const room = await roomsService.deleteRoom(id);

  res.json(room);
});
