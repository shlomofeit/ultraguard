export type AlertType = "room_silent" | "room_back" | "beacon";

export interface Alert {
  id: string;
  roomId: string;
  type: AlertType;
  message: string;
  createdAt: string;
  readAt: string | null;
}
