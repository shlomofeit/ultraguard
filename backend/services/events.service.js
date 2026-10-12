import { eventsRepo } from '../repositories/events.repo.js';
import { roomsService } from './rooms.service.js';
import {
  createEventSchema,
  validateSchema,
  getEventsSchema,
} from '../utils/validation.js';

function toRow(event, device) {
  const row = {
    id: event.id,
    device_id: device.id,
    room_id: device.roomId,
    started_at: event.startedAt,
    duration_ms: event.durationMs,
    type: event.type,
    confidence: event.confidence,
    peak_freq_hz: event.peakFreqHz,
    freqs_hz: event.freqsHz,
    snr_db: event.snrDb,
    payload: event.payload,
    sample_rate: event.sampleRate,
  };

  return row;
}

function toEvent(row) {
  const event = {
    id: row.id,
    deviceId: row.device_id,
    roomId: row.room_id,
    startedAt: row.started_at,
    receivedAt: row.received_at,
    durationMs: row.duration_ms,
    type: row.type,
    confidence: row.confidence,
    peakFreqHz: row.peak_freq_hz,
    freqsHz: row.freqs_hz,
    snrDb: row.snr_db,
    payload: row.payload,
    sampleRate: row.sample_rate,
    isKnownSource: row.is_known_source,
  };

  return event;
}

async function createEvent(eventData, device) {
  const event = validateSchema(createEventSchema, eventData);
  const row = toRow(event, device);
  const savedRows = await eventsRepo.createEvent(row);

  if (savedRows.length === 0) {
    return null;
  }

  const savedEvent = toEvent(savedRows[0]);
  return savedEvent;
}

async function getEvents(query, user) {
  const filter = validateSchema(getEventsSchema, query);
  const allowedRoomIds = await roomsService.getAllowedRoomIds(user);

  if (allowedRoomIds !== null) {
    if (filter.roomId && !allowedRoomIds.includes(filter.roomId)) {
      const error = new Error("You don't have access to this room!");
      error.status = 403;
      throw error;
    }
    filter.roomIds = allowedRoomIds;
  }

  const rows = await eventsRepo.getEvents(filter);
  const events = rows.map((row) => toEvent(row));

  return events;
}

export const eventsService = { createEvent, getEvents };
