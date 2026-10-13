import type { RoomState, RoomStatus } from "../types/room";

const STATE_ORDER: Record<RoomState, number> = {
  silent: 0,
  active: 1,
  "no-devices": 2,
};

export const sortRoomStatuses = (statuses: RoomStatus[]): RoomStatus[] =>
  [...statuses].sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      a.roomName.localeCompare(b.roomName, "he"),
  );
