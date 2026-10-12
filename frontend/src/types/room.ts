export interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export interface RoomStatus {
  roomId: string;
  activeDevices: number;
}

export interface RoomInput {
  name: string;
}

export interface RoomFormErrors {
  name?: string;
}
