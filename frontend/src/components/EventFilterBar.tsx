import type { EventFilter } from "../types/event";
import { BEACON_TYPES, EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";

interface EventsFilterBarProps {
  filter: EventFilter;
  onChange: (filter: EventFilter) => void;
}

const RANGE_OPTIONS = [
  { hours: 1, label: "שעה אחרונה" },
  { hours: 24, label: "24 שעות" },
  { hours: 168, label: "שבוע" },
  { hours: 0, label: "הכול" },
];

const EventsFilterBar = ({ filter, onChange }: EventsFilterBarProps) => {
  const handleTypeChange = (type: string) => {
    onChange({ ...filter, type: type as EventFilter["type"] });
  };

  const handleRangeChange = (hours: string) => {
    onChange({ ...filter, rangeHours: Number(hours) });
  };

  return (
    <div className="events-filter-bar">
      <label htmlFor="type-select">סוג</label>
      <select
        id="type-select"
        value={filter.type}
        onChange={(e) => handleTypeChange(e.target.value)}
      >
        <option value="all">כל הסוגים</option>
        {BEACON_TYPES.map((type) => (
          <option key={type} value={type}>
            {EVENT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      <label htmlFor="range-select">טווח</label>
      <select
        id="range-select"
        value={filter.rangeHours}
        onChange={(e) => handleRangeChange(e.target.value)}
      >
        {RANGE_OPTIONS.map((option) => (
          <option key={option.hours} value={option.hours}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EventsFilterBar;
