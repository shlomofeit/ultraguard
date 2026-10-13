import { describe, expect, it } from "vitest";
import type { RoomState, RoomStatus } from "../../src/types/room";
import { sortRoomStatuses } from "../../src/utils/sortRoomStatuses";

const status = (roomName: string, state: RoomState): RoomStatus => ({
  roomId: roomName,
  roomName,
  state,
  activeDevices: 0,
  totalDevices: 0,
  lastSeenAt: null,
  eventsLastDay: 0,
  lastEventAt: null,
  lastEventType: null,
});

describe("sortRoomStatuses", () => {
  it("puts silent rooms first and rooms without devices last", () => {
    const sorted = sortRoomStatuses([
      status("Gym", "no-devices"),
      status("Class", "active"),
      status("Lab", "silent"),
    ]);

    expect(sorted.map((item) => item.state)).toEqual([
      "silent",
      "active",
      "no-devices",
    ]);
  });

  it("sorts rooms with the same state by name", () => {
    const sorted = sortRoomStatuses([
      status("כיתה ב", "active"),
      status("כיתה א", "active"),
    ]);

    expect(sorted.map((item) => item.roomName)).toEqual(["כיתה א", "כיתה ב"]);
  });

  it("does not change the list it gets", () => {
    const statuses = [status("B", "active"), status("A", "silent")];

    sortRoomStatuses(statuses);

    expect(statuses[0].roomName).toBe("B");
  });
});
