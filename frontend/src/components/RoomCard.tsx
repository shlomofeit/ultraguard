import type { RoomState, RoomStatus } from "../types/room";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import { EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";

interface RoomCardProps {
  status: RoomStatus;
  nowMs: number;
  onOpen: (roomId: string) => void;
}

const STATE_LABELS: Record<RoomState, string> = {
  active: "פעיל",
  silent: "שקט",
  "no-devices": "אין מכשיר",
};

const STATE_MESSAGES: Record<RoomState, string> = {
  active: "מאזין עכשיו",
  silent: "המכשירים בחדר הפסיקו לדווח",
  "no-devices": "אין מכשיר משויך. מוסיפים מכשיר בדף הניהול.",
};

const RoomCard = ({ status, nowMs, onOpen }: RoomCardProps) => {
  const hasDevices = status.state !== "no-devices";

  const getLastSeen = () => {
    if (status.state === "active") {
      return "עכשיו";
    }
    return status.lastSeenAt ? formatTimeAgo(status.lastSeenAt, nowMs) : "–";
  };

  return (
    <button
      className={`room-card ${status.state}`}
      onClick={() => onOpen(status.roomId)}
    >
      <div className="room-top">
        <h3>{status.roomName}</h3>
        <span className="state">
          <i />
          {STATE_LABELS[status.state]}
        </span>
      </div>
      <p className="room-msg">{STATE_MESSAGES[status.state]}</p>
      <div className="room-facts">
        <span>
          מכשירים
          <b>
            {hasDevices
              ? `${status.activeDevices}/${status.totalDevices}`
              : "0"}
          </b>
        </span>
        <span>
          אירועים · 24ש׳
          <b>{hasDevices ? status.eventsLastDay : "–"}</b>
        </span>
        <span>
          דיווח אחרון<b>{getLastSeen()}</b>
        </span>
      </div>
      {status.lastEventType && status.lastEventAt ? (
        <p className="room-last">
          אירוע אחרון: <b>{EVENT_TYPE_LABELS[status.lastEventType]}</b> ·{" "}
          {formatTimeAgo(status.lastEventAt, nowMs)}
        </p>
      ) : (
        <p className="room-last">{hasDevices ? "אין אירועים עדיין" : " "}</p>
      )}
    </button>
  );
};

export default RoomCard;
