import express from 'express';
import { roomsService } from '../services/rooms.service.js';

export const router = express.Router();

router.get('/', async (req, res) => {
  const rooms = await roomsService.getRooms();

  res.json(rooms);
});
