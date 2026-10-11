import axios from "axios";
import type { Room } from "../types/room";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/rooms`;

export const getRooms = async (): Promise<Room[]> => {
  const { data } = await axios.get<Room[]>(BASE_URL, { withCredentials: true });
  return data;
};
