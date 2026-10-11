import axios from "axios";
import type { Event } from "../types/event";

export const BASE_URL = `${import.meta.env.VITE_API_URL}/api/event`;

export const getEvents = async (roomId: string): Promise<Event[]> => {
  const { data } = await axios.get<Event[]>(BASE_URL, {
    params: roomId,
    withCredentials: true,
  });
  return data;
};
