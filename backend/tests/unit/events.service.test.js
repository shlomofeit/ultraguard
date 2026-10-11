import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventsService } from '../../services/events.service.js';
import { eventsRepo } from '../../repositories/events.repo.js';

vi.mock('../../repositories/events.repo.js', () => ({
  eventsRepo: { createEvent: vi.fn() },
}));

const device = { id: 'device-1', roomId: 'room-1' };

const validEvent = {
  id: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  startedAt: '2026-10-11T08:00:00.000Z',
  durationMs: 960,
  type: 'silverpush',
  confidence: 0.9,
  peakFreqHz: 18000,
  freqsHz: [18000, 18500, 19500],
  snrDb: 42,
  payload: 'UG01',
  sampleRate: 44100,
};

describe('eventsService.createEvent', () => {
  beforeEach(() => {
    vi.mocked(eventsRepo.createEvent).mockReset();
  });

  it('rejects an event with a missing field with status 400', async () => {
    const { type, ...eventWithoutType } = validEvent;

    await expect(
      eventsService.createEvent(eventWithoutType, device)
    ).rejects.toMatchObject({ status: 400 });
    expect(eventsRepo.createEvent).not.toHaveBeenCalled();
  });

  it('takes the device and room from the connection, not from the body', async () => {
    vi.mocked(eventsRepo.createEvent).mockResolvedValue([
      { id: validEvent.id, device_id: 'device-1', room_id: 'room-1' },
    ]);
    const body = { ...validEvent, deviceId: 'fake', roomId: 'fake' };

    await eventsService.createEvent(body, device);

    const row = vi.mocked(eventsRepo.createEvent).mock.calls[0][0];
    expect(row.device_id).toBe('device-1');
    expect(row.room_id).toBe('room-1');
  });

  it('returns null when the event was already saved', async () => {
    vi.mocked(eventsRepo.createEvent).mockResolvedValue([]);

    const event = await eventsService.createEvent(validEvent, device);

    expect(event).toBeNull();
  });
});
