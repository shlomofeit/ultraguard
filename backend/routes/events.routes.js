import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { eventsService } from '../services/events.service.js';
import { eventFeaturesService } from '../services/eventFeatures.service.js';

export const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const events = await eventsService.getEvents(req.query, req.user);

  res.json(events);
});

router.get('/:id/features', async (req, res) => {
  const { id } = req.params;
  const eventFeatures = await eventFeaturesService.getFeatures(id, req.user);

  res.json(eventFeatures);
});
