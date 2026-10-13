import { useState } from "react";
import type { Alert } from "../types/alert";
import { formatTimeAgo } from "../utils/formatTimeAgo";

interface AlertsBellProps {
  alerts: Alert[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}

const AlertsBell = ({ alerts, onRead, onReadAll }: AlertsBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = alerts.filter((alert) => !alert.readAt).length;

  return (
    <div className="bell-wrap">
      <button
        className="bell"
        aria-label="התראות"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="bell-menu">
          <div className="bell-head">
            <b>התראות</b>
            {unreadCount > 0 && <button onClick={onReadAll}>סמן הכל כנקרא</button>}
          </div>
          {alerts.length === 0 && <p className="note bell-empty">אין התראות</p>}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-row ${alert.type} ${alert.readAt ? "read" : ""}`}
            >
              <span className="pip" />
              <div>
                {alert.message}
                <small>{formatTimeAgo(alert.createdAt, Date.now())}</small>
              </div>
              {!alert.readAt && (
                <button onClick={() => onRead(alert.id)}>נקרא</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsBell;
