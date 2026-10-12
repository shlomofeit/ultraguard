import { describe, expect, it } from "vitest";
import {
  HEARTBEAT_MS,
  MISSED_HEARTBEATS,
  presenceService,
} from "../../services/presence.service.js";

const device = (id, roomId) => ({ id, roomId });

describe("presenceService", () => {
  it("counts a connected device as active in its room", () => {
    presenceService.connectDevice("socket-1", device("device-1", "room-a"), 0);

    expect(presenceService.getRoomStatus("room-a", 1000)).toEqual({
      roomId: "room-a",
      activeDevices: 1,
    });
    expect(presenceService.getRoomStatus("room-other", 1000).activeDevices).toBe(0);
  });

  it("counts the same device twice only once", () => {
    presenceService.connectDevice("socket-2", device("device-2", "room-b"), 0);
    presenceService.connectDevice("socket-3", device("device-2", "room-b"), 0);

    expect(presenceService.getRoomStatus("room-b", 0).activeDevices).toBe(1);
  });

  it("stops counting a device after 3 missed heartbeats", () => {
    presenceService.connectDevice("socket-4", device("device-4", "room-c"), 0);
    const quietMs = HEARTBEAT_MS * MISSED_HEARTBEATS + 1;

    expect(presenceService.getRoomStatus("room-c", quietMs).activeDevices).toBe(0);

    presenceService.recordHeartbeat("socket-4", { isMicLive: true }, quietMs);
    expect(presenceService.getRoomStatus("room-c", quietMs).activeDevices).toBe(1);
  });

  it("does not count a device whose microphone is off", () => {
    presenceService.connectDevice("socket-5", device("device-5", "room-d"), 0);
    presenceService.recordHeartbeat("socket-5", { isMicLive: false }, 1000);

    expect(presenceService.getRoomStatus("room-d", 1000).activeDevices).toBe(0);
  });

  it("removes a device when it disconnects", () => {
    presenceService.connectDevice("socket-6", device("device-6", "room-e"), 0);
    presenceService.disconnectDevice("socket-6");

    expect(presenceService.getRoomStatus("room-e", 0).activeDevices).toBe(0);
  });

  it("reports a room status only when it changes", () => {
    presenceService.connectDevice("socket-7", device("device-7", "room-f"), 0);
    const first = presenceService.getChangedStatuses(0);
    expect(first).toContainEqual({ roomId: "room-f", activeDevices: 1 });

    const second = presenceService.getChangedStatuses(0);
    expect(second.find((status) => status.roomId === "room-f")).toBeUndefined();

    presenceService.disconnectDevice("socket-7");
    expect(presenceService.getChangedStatuses(0)).toContainEqual({
      roomId: "room-f",
      activeDevices: 0,
    });
  });
});
