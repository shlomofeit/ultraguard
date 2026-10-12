import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventsService } from '../../services/events.service.js';
import { eventsRepo } from '../../repositories/events.repo.js';
import { roomMembersRepo } from '../../repositories/roomMembers.repo.js';

vi.mock('../../repositories/events.repo.js', () => ({
  eventsRepo: { createEvent: vi.fn(), getEvents: vi.fn() },
}));

vi.mock('../../repositories/roomMembers.repo.js', () => ({
  roomMembersRepo: { getRoomIdsByUser: vi.fn() },
}));

const ROOM_A = '1a1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ROOM_B = '2b1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const admin = { id: 'admin-1', role: 'admin' };
const viewer = { id: 'viewer-1', role: 'viewer' };

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

describe('eventsService.getEvents', () => {
  beforeEach(() => {
    vi.mocked(eventsRepo.getEvents).mockReset();
  });

  it('uses a limit of 50 when none is given', async () => {
    vi.mocked(eventsRepo.getEvents).mockResolvedValue([]);

    await eventsService.getEvents({}, admin);

    const filter = vi.mocked(eventsRepo.getEvents).mock.calls[0][0];
    expect(filter.limit).toBe(50);
  });

  it('passes only the allowed fields to the repository', async () => {
    vi.mocked(eventsRepo.getEvents).mockResolvedValue([]);

    await eventsService.getEvents({ limit: '10', hack: '1' }, admin);

    const filter = vi.mocked(eventsRepo.getEvents).mock.calls[0][0];
    expect(filter).toEqual({ limit: 10 });
  });

  it('rejects a limit above 200 with status 400', async () => {
    await expect(
      eventsService.getEvents({ limit: '500' }, admin)
    ).rejects.toMatchObject({ status: 400 });
    expect(eventsRepo.getEvents).not.toHaveBeenCalled();
  });

  it('returns events in camelCase', async () => {
    vi.mocked(eventsRepo.getEvents).mockResolvedValue([
      { id: validEvent.id, room_id: 'room-1', peak_freq_hz: 18000 },
    ]);

    const [event] = await eventsService.getEvents({}, admin);

    expect(event.roomId).toBe('room-1');
    expect(event.peakFreqHz).toBe(18000);
    expect(event).not.toHaveProperty('room_id');
  });

  it('limits a viewer to the rooms given to them', async () => {
    vi.mocked(roomMembersRepo.getRoomIdsByUser).mockResolvedValue([ROOM_A]);
    vi.mocked(eventsRepo.getEvents).mockResolvedValue([]);

    await eventsService.getEvents({}, viewer);

    const filter = vi.mocked(eventsRepo.getEvents).mock.calls[0][0];
    expect(filter.roomIds).toEqual([ROOM_A]);
  });

  it('rejects a viewer asking for another room with status 403', async () => {
    vi.mocked(roomMembersRepo.getRoomIdsByUser).mockResolvedValue([ROOM_A]);

    await expect(
      eventsService.getEvents({ roomId: ROOM_B }, viewer)
    ).rejects.toMatchObject({ status: 403 });
    expect(eventsRepo.getEvents).not.toHaveBeenCalled();
  });
});
