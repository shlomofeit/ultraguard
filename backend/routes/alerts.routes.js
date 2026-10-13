import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { alertsService } from "../services/alerts.service.js";

export const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const alerts = await alertsService.getAlerts(req.user);

  res.json(alerts);
});

router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  const alert = await alertsService.markAlertRead(id, req.user);

  res.json(alert);
});
