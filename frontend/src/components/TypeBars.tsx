import type { CSSProperties } from "react";
import type { Event } from "../types/event";
import { BEACON_TYPES, EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";
import { EVENT_TYPE_COLORS } from "../utils/eventTypeColors";
import { countEventsByType } from "../utils/eventFilter";

interface TypeBarsProps {
  events: Event[];
}

const TypeBars = ({ events }: TypeBarsProps) => {
  const counts = countEventsByType(events);
  const max = Math.max(1, ...BEACON_TYPES.map((type) => counts.get(type) ?? 0));

  return (
    <div className="type-bars">
      {BEACON_TYPES.map((type) => {
        const count = counts.get(type) ?? 0;
        const style = {
          "--c": EVENT_TYPE_COLORS[type],
          "--w": `${(count / max) * 100}%`,
        } as CSSProperties;
        return (
          <div key={type} className="type-bar" style={style}>
            <span>{EVENT_TYPE_LABELS[type]}</span>
            <div className="track">
              <div className="fill" />
            </div>
            <b>{count}</b>
          </div>
        );
      })}
    </div>
  );
};

export default TypeBars;
