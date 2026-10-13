import type { EventType } from "./event";

export interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export type RoomState = "active" | "silent" | "no-devices";

export interface RoomStatus {
  roomId: string;
  roomName: string;
  state: RoomState;
  activeDevices: number;
  totalDevices: number;
  lastSeenAt: string | null;
  eventsLastDay: number;
  lastEventAt: string | null;
  lastEventType: EventType | null;
}

export interface RoomInput {
  name: string;
}

export interface RoomFormErrors {
  name?: string;
}
