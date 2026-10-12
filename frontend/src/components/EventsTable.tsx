import type { CSSProperties } from "react";
import type { Event } from "../types/event";
import { EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";
import { EVENT_TYPE_COLORS } from "../utils/eventTypeColors";

interface EventsTableProps {
  events: Event[];
}

const NEW_EVENT_MS = 5000;

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("he-IL");

const isNewEvent = (event: Event) =>
  Date.now() - Date.parse(event.receivedAt) < NEW_EVENT_MS;

const EventsTable = ({ events }: EventsTableProps) => {
  if (events.length === 0) {
    return <p className="empty">אין עדיין אירועים בחדר הזה</p>;
  }

  return (
    <div className="event-list">
      <div className="event-list-head">
        <span>שעה</span>
        <span>סוג</span>
        <span>תדר שיא</span>
        <span>משך</span>
        <span>SNR</span>
        <span>תוכן</span>
      </div>
      <div className="event-rows">
        {events.map((event) => (
          <div
            key={event.id}
            className={isNewEvent(event) ? "event-row is-new" : "event-row"}
          >
            <span className="mono time">{formatTime(event.startedAt)}</span>
            <span
              className="type-badge"
              style={{ "--c": EVENT_TYPE_COLORS[event.type] } as CSSProperties}
            >
              <i className="dot" />
              {EVENT_TYPE_LABELS[event.type]}
              <small>{Math.round(event.confidence * 100)}%</small>
            </span>
            <span className="mono" dir="ltr">
              {event.peakFreqHz} Hz
            </span>
            <span className="mono" dir="ltr">
              {event.durationMs} ms
            </span>
            <span className="mono" dir="ltr">
              {event.snrDb.toFixed(0)} dB
            </span>
            <span className="mono payload" dir="auto">
              {event.payload ?? "–"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsTable;
