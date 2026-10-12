import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { devicesService } from "../services/devices.service.js";

export const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", async (req, res) => {
  const devices = await devicesService.getDevices();

  res.json(devices);
});

router.post("/", async (req, res) => {
  const created = await devicesService.createDevice(req.body);

  res.status(201).json(created);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const device = await devicesService.revokeDevice(id);

  res.json(device);
});
