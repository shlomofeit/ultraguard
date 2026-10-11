import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { eventsService } from '../services/events.service.js';

export const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const events = await eventsService.getEvents(req.query);

  res.json(events);
});
