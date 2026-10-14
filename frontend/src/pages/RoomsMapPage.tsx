import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomStatusStore } from "../store/roomStatusStore";
import { useAuthStore } from "../store/authStore";
import RoomCard from "../components/RoomCard";
import type { RoomState } from "../types/room";
import { sortRoomStatuses } from "../utils/sortRoomStatuses";

const REFRESH_MS = 60 * 1000;

const RoomsMapPage = () => {
  const statuses = useRoomStatusStore((state) => state.statuses);
  const isLoading = useRoomStatusStore((state) => state.isLoading);
  const error = useRoomStatusStore((state) => state.error);
  const setRoomsStatus = useRoomStatusStore((state) => state.setRoomsStatus);
  const user = useAuthStore((state) => state.user);
  const [nowMs, setNowMs] = useState(Date.now());
  const nav = useNavigate();

  useEffect(() => {
    setRoomsStatus();
    const timer = setInterval(() => {
      setNowMs(Date.now());
      setRoomsStatus();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [setRoomsStatus]);

  const countState = (state: RoomState) =>
    statuses.filter((status) => status.state === state).length;

  const handleOpen = (roomId: string) => {
    nav(`/stats?room=${roomId}`);
  };

  return (
    <main className="rooms-map-page">
      <header className="page-head">
        <div>
          <h1>{user?.role === "admin" ? "מפת חדרים" : "החדרים שלי"}</h1>
          <p>מצב חי של כל החדרים. חדר שמפסיק לדווח מסומן באדום ומקפיץ התראה.</p>
        </div>
        <div className="map-summary">
          <span>
            <b>{countState("active")}</b> פעילים
          </span>
          <span className="bad">
            <b>{countState("silent")}</b> שקטים
          </span>
          <span>
            <b>{countState("no-devices")}</b> בלי מכשיר
          </span>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {isLoading && <p className="empty">טוען...</p>}
      {!isLoading && statuses.length === 0 && (
        <p className="empty">עוד אין חדרים להצגה.</p>
      )}

      <div className="room-grid">
        {sortRoomStatuses(statuses).map((status) => (
          <RoomCard
            key={status.roomId}
            status={status}
            nowMs={nowMs}
            onOpen={handleOpen}
          />
        ))}
      </div>
    </main>
  );
};

export default RoomsMapPage;
