import axios from "axios";
import type { Event, EventFilter } from "../types/event";
import { getFromDate } from "../utils/eventFilter";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/events`;
const EVENTS_LIMIT = 200;

export const getEvents = async (
  roomId: string,
  filter: EventFilter,
): Promise<Event[]> => {
  const { data } = await axios.get<Event[]>(BASE_URL, {
    params: {
      roomId,
      type: filter.type === "all" ? undefined : filter.type,
      from: getFromDate(filter, Date.now()),
      limit: EVENTS_LIMIT,
    },
    withCredentials: true,
  });
  return data;
};
