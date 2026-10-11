import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Event } from "../types/event";
import { BEACON_TYPES, EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";
import { countEventsByType } from "../utils/eventFilter";

interface EventsChartProps {
  events: Event[];
}

const EventsChart = ({ events }: EventsChartProps) => {
  const counts = countEventsByType(events);
  const data = BEACON_TYPES.map((type) => ({
    label: EVENT_TYPE_LABELS[type],
    count: counts.get(type) ?? 0,
  }));

  return (
    <div className="events-chart" dir="ltr">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="אירועים" fill="#1f6f5c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EventsChart;
