import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventFeaturesService } from "../../services/eventFeatures.service.js";
import { eventFeaturesRepo } from "../../repositories/eventFeatures.repo.js";
import { roomsService } from "../../services/rooms.service.js";

vi.mock("../../repositories/eventFeatures.repo.js", () => ({
  eventFeaturesRepo: { saveFeatures: vi.fn(), getFeaturesByEventId: vi.fn() },
}));

vi.mock("../../services/rooms.service.js", () => ({
  roomsService: { canAccessRoom: vi.fn() },
}));

const viewer = { id: "viewer-1", role: "viewer" };

const event = {
  id: "event-1",
  roomId: "room-1",
  deviceId: "device-1",
  type: "silverpush",
  startedAt: "2026-10-14T08:00:00.000Z",
  payload: "UG01",
};

const features = {
  meanEntropy: 0.21,
  isStable: true,
  isSweep: false,
  mainPeaksHz: [18000, 18250],
  meanFrameFreqs: 1.4,
  switchRate: 0.35,
  decodedType: "silverpush",
  suspicion: "decoded",
};

describe("eventFeaturesService", () => {
  beforeEach(() => {
    vi.mocked(eventFeaturesRepo.saveFeatures).mockReset();
  });

  it("saves the features of an event under the event id", async () => {
    const saved = await eventFeaturesService.saveFeatures(event, features);

    const doc = vi.mocked(eventFeaturesRepo.saveFeatures).mock.calls[0][0];
    expect(doc._id).toBe("event-1");
    expect(doc.roomId).toBe("room-1");
    expect(doc.startedAt).toEqual(new Date("2026-10-14T08:00:00.000Z"));
    expect(doc.features).toEqual(features);
    expect(saved.eventId).toBe("event-1");
    expect(saved.startedAt).toBe("2026-10-14T08:00:00.000Z");
  });

  it("does nothing when the listener sent no features", async () => {
    const saved = await eventFeaturesService.saveFeatures(event, undefined);

    expect(saved).toBeNull();
    expect(eventFeaturesRepo.saveFeatures).not.toHaveBeenCalled();
  });

  it("rejects broken features with status 400", async () => {
    await expect(
      eventFeaturesService.saveFeatures(event, { ...features, switchRate: 3 }),
    ).rejects.toMatchObject({ status: 400 });
    expect(eventFeaturesRepo.saveFeatures).not.toHaveBeenCalled();
  });

  it("returns the features of an event in a room the user can see", async () => {
    vi.mocked(eventFeaturesRepo.getFeaturesByEventId).mockResolvedValue({
      _id: "event-1",
      ...event,
      startedAt: new Date(event.startedAt),
      features,
    });
    vi.mocked(roomsService.canAccessRoom).mockResolvedValue(true);

    const eventFeatures = await eventFeaturesService.getFeatures(
      "event-1",
      viewer,
    );

    expect(eventFeatures.features.mainPeaksHz).toEqual([18000, 18250]);
  });

  it("hides features of another room with status 404", async () => {
    vi.mocked(eventFeaturesRepo.getFeaturesByEventId).mockResolvedValue({
      _id: "event-1",
      ...event,
      startedAt: new Date(event.startedAt),
      features,
    });
    vi.mocked(roomsService.canAccessRoom).mockResolvedValue(false);

    await expect(
      eventFeaturesService.getFeatures("event-1", viewer),
    ).rejects.toMatchObject({ status: 404 });
  });
});
