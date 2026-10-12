import { useEffect } from "react";
import { useEventsStore } from "../store/eventsStore";
import EventsTable from "../components/EventsTable";
import EventsFilterBar from "../components/EventFilterBar";
import StatCard from "../components/StatCard";
import LiveWave from "../components/LiveWave";
import Waterfall from "../components/Waterfall";
import TypeBars from "../components/TypeBars";
import { countRecentEvents } from "../utils/eventFilter";
import { EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("he-IL");

const DashboardPage = () => {
  const rooms = useEventsStore((state) => state.rooms);
  const events = useEventsStore((state) => state.events);
  const selectedRoomId = useEventsStore((state) => state.selectedRoomId);
  const isLive = useEventsStore((state) => state.isLive);
  const activeDevices = useEventsStore((state) => state.activeDevices);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const filter = useEventsStore((state) => state.filter);
  const setRooms = useEventsStore((state) => state.setRooms);
  const setSelectedRoom = useEventsStore((state) => state.setSelectedRoom);
  const setStopLive = useEventsStore((state) => state.setStopLive);
  const setFilter = useEventsStore((state) => state.setFilter);

  useEffect(() => {
    setRooms();
    return () => setStopLive();
  }, [setRooms, setStopLive]);

  const roomName = rooms.find((room) => room.id === selectedRoomId)?.name;
  const lastEvent = events[0];
  const lastPayload = events.find((event) => event.payload)?.payload;
  const trend = countRecentEvents(events, Date.now());
  const lastHourCount = trend.reduce((sum, count) => sum + count, 0);
  const isRoomListening = isLive && activeDevices > 0;

  const getLiveText = () => {
    if (!isLive) {
      return "אין חיבור לשרת";
    }
    if (activeDevices === 0) {
      return "אין מכשיר מאזין בחדר";
    }
    const devicesText =
      activeDevices === 1 ? "מכשיר אחד" : `${activeDevices} מכשירים`;
    return `מאזין לחדר בזמן אמת · ${devicesText}`;
  };

  return (
    <main className="dashboard-page">
      <header className="page-head">
        <h1>{roomName ?? "דשבורד"}</h1>
        <span className={isRoomListening ? "live on" : "live"}>
          <LiveWave analyser={null} />
          {getLiveText()}
        </span>
      </header>

      <div className="toolbar">
        <label htmlFor="room-select">חדר</label>
        <select
          id="room-select"
          value={selectedRoomId ?? ""}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <EventsFilterBar filter={filter} onChange={setFilter} />
      </div>

      {error && <p className="form-error">{error}</p>}
      {!isLoading && rooms.length === 0 && (
        <p className="empty">עוד לא הוקצו לך חדרים. אפשר לבקש מהמנהל.</p>
      )}

      <div className="stats">
        <StatCard
          label="אירועים בשעה האחרונה"
          value={String(lastHourCount)}
          note={`מתוך ${events.length} בטווח שנבחר`}
          trend={trend}
          isHot
        />
        <StatCard
          label="האחרון"
          value={
            lastEvent ? `${(lastEvent.peakFreqHz / 1000).toFixed(1)} kHz` : "–"
          }
          note={
            lastEvent
              ? `${EVENT_TYPE_LABELS[lastEvent.type]} · ${formatTime(lastEvent.startedAt)}`
              : "ממתין לאירוע"
          }
        />
        <StatCard
          label="תוכן שפוענח"
          value={lastPayload ?? "–"}
          note="הטקסט האחרון שביקון נשא"
        />
        <StatCard
          label="מכשירים פעילים"
          value={String(activeDevices)}
          note="מכשירים ששולחים דופק כל 10 שניות"
        />
      </div>

      <section className="glass panel">
        <div className="panel-head">
          <h2>מפל תדרים</h2>
          <small>כל הבזק הוא אירוע חדש. הזמן זורם למטה.</small>
        </div>
        <Waterfall events={events} />
      </section>

      <div className="columns">
        <section className="glass panel">
          <h2>אירועים</h2>
          {isLoading ? (
            <p className="empty">טוען...</p>
          ) : (
            <EventsTable events={events} />
          )}
        </section>
        <section className="glass panel">
          <h2>לפי סוג</h2>
          <TypeBars events={events} />
          <p className="note">מתעדכן עם כל אירוע שנכנס.</p>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
