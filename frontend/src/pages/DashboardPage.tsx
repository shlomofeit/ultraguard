import { useEffect } from "react";
import { useEventsStore } from "../store/eventsStore";
import EventsTable from "../components/EventsTable";
import { useAuthStore } from "../store/authStore";
import EventsFilterBar from "../components/EventFilterBar";
import EventsChart from "../components/EventsChart";

const DashboardPage = () => {
  const rooms = useEventsStore((state) => state.rooms);
  const events = useEventsStore((state) => state.events);
  const selectedRoomId = useEventsStore((state) => state.selectedRoomId);
  const isLive = useEventsStore((state) => state.isLive);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const setRooms = useEventsStore((state) => state.setRooms);
  const setSelectedRoom = useEventsStore((state) => state.setSelectedRoom);
  const setStopLive = useEventsStore((state) => state.setStopLive);
  const user = useAuthStore((state) => state.user);
  const setLogout = useAuthStore((state) => state.setLogout);
  const filter = useEventsStore((state) => state.filter);
  const setFilter = useEventsStore((state) => state.setFilter);

  useEffect(() => {
    setRooms();
    return () => setStopLive();
  }, [setRooms, setStopLive]);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  return (
    <main className="dashboard-page">
      <header className="app-header">
        <h1>דשבורד</h1>
        <p>שלום, {user?.name}</p>
        <button onClick={setLogout}>התנתק</button>
      </header>

      <label htmlFor="room-select">חדר</label>
      <select
        id="room-select"
        value={selectedRoomId ?? ""}
        onChange={(e) => handleRoomChange(e.target.value)}
      >
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      <EventsFilterBar filter={filter} onChange={setFilter} />

      <p>{isLive ? "מחובר, אירועים חדשים יופיעו כאן" : "אין חיבור לשרת"}</p>
      {error && <p className="form-error">{error}</p>}
      {isLoading ? (
        <p>טוען...</p>
      ) : (
        <>
          <EventsChart events={events} />
          <EventsTable events={events} />
        </>
      )}
    </main>
  );
};

export default DashboardPage;
