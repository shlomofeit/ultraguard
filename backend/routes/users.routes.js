import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { usersService } from "../services/users.service.js";

export const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", async (req, res) => {
  const users = await usersService.getUsers();

  res.json(users);
});

router.put("/:id/rooms", async (req, res) => {
  const { id } = req.params;
  const user = await usersService.setUserRooms(id, req.body);

  res.json(user);
});

router.patch("/:id/role", async (req, res) => {
  const { id } = req.params;
  const user = await usersService.setUserRole(req.user, id, req.body);

  res.json(user);
});
