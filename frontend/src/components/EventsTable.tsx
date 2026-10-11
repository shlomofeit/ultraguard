import type { Event } from "../types/event";
import { EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";

interface EventsTableProps {
  events: Event[];
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("he-IL");

const EventsTable = ({ events }: EventsTableProps) => {
  if (events.length === 0) {
    return <p>אין עדיין אירועים בחדר הזה</p>;
  }

  return (
    <table className="events-table">
      <thead>
        <tr>
          <th>שעה</th>
          <th>סוג</th>
          <th>ביטחון</th>
          <th>תדר שיא</th>
          <th>משך</th>
          <th>SNR</th>
          <th>תוכן</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td>{formatTime(event.startedAt)}</td>
            <td>{EVENT_TYPE_LABELS[event.type]}</td>
            <td dir="ltr">{Math.round(event.confidence * 100)}%</td>
            <td dir="ltr">{event.peakFreqHz} Hz</td>
            <td dir="ltr">{event.durationMs} ms</td>
            <td dir="ltr">{event.snrDb.toFixed(0)} dB</td>
            <td dir="auto">{event.payload ?? "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EventsTable;
