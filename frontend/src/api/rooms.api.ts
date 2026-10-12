import axios from "axios";
import type { Room, RoomInput } from "../types/room";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/rooms`;

export const getRooms = async (): Promise<Room[]> => {
  const { data } = await axios.get<Room[]>(BASE_URL, { withCredentials: true });
  return data;
};

export const createRoom = async (input: RoomInput): Promise<Room> => {
  const { data } = await axios.post<Room>(BASE_URL, input, {
    withCredentials: true,
  });
  return data;
};
