import express from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { devicesService } from "../services/devices.service.js";

export const router = express.Router();

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: "Too many attempts, try again later!" },
});

router.post("/verify", authMiddleware, verifyLimiter, async (req, res) => {
  const keyInfo = await devicesService.verifyDeviceKey(req.body);

  res.json(keyInfo);
});

router.use(authMiddleware, adminMiddleware);

router.get("/", async (req, res) => {
  const devices = await devicesService.getDevices();

  res.json(devices);
});

router.post("/", async (req, res) => {
  const created = await devicesService.createDevice(req.body);

  res.status(201).json(created);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const device = await devicesService.updateDevice(id, req.body);

  res.json(device);
});

router.patch("/:id/revoke", async (req, res) => {
  const { id } = req.params;
  const device = await devicesService.revokeDevice(id);

  res.json(device);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const device = await devicesService.deleteDevice(id);

  res.json(device);
});
