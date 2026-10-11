import type { Event, EventFilter, EventType } from "../types/event";

const HOUR_MS = 60 * 60 * 1000;

export const getFromDate = (filter: EventFilter, nowMs: number) => {
  if (filter.rangeHours === 0) {
    return undefined;
  }
  return new Date(nowMs - filter.rangeHours * HOUR_MS).toISOString();
};

export const matchesFilter = (
  event: Event,
  filter: EventFilter,
  nowMs: number,
) => {
  if (filter.type !== "all" && event.type !== filter.type) {
    return false;
  }
  const from = getFromDate(filter, nowMs);
  return !from || event.startedAt >= from;
};

export const countEventsByType = (events: Event[]) => {
  const counts = new Map<EventType, number>();
  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }
  return counts;
};
