import { useEffect } from "react";
import { useEventsStore } from "../store/eventsStore";
import EventsTable from "../components/EventsTable";

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

  useEffect(() => {
    setRooms();
    return () => setStopLive();
  }, [setRooms, setStopLive]);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  return (
    <main className="dashboard-page">
      <h1>דשבורד</h1>

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

      <p>{isLive ? "מחובר, אירועים חדשים יופיעו כאן" : "אין חיבור לשרת"}</p>
      {error && <p className="form-error">{error}</p>}
      {isLoading ? <p>טוען...</p> : <EventsTable events={events} />}
    </main>
  );
};

export default DashboardPage;
