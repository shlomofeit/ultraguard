import express from 'express';
import { eventsService } from '../services/events.service.js';

export const router = express.Router();

router.get('/', async (req, res) => {
  const events = await eventsService.getEvents(req.query);

  res.json(events);
});
