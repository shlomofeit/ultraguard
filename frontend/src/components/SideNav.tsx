import { NavLink } from "react-router-dom";
import type { User } from "../types/user";
import type { Alert } from "../types/alert";
import Logo from "./Logo";
import LiveWave from "./LiveWave";
import AlertsBell from "./AlertsBell";

interface SideNavProps {
  user: User;
  isListening: boolean;
  analyser: AnalyserNode | null;
  silentCount: number;
  alerts: Alert[];
  onAlertRead: (id: string) => void;
  onAllAlertsRead: () => void;
  onLogout: () => void;
}

const ADMIN_LINKS = [
  { to: "/rooms", label: "מפת חדרים" },
  { to: "/stats", label: "סטטיסטיקות" },
  { to: "/listen", label: "האזנה" },
  { to: "/admin", label: "ניהול" },
  { to: "/beacons", label: "מחולל ביקונים", isBeta: true },
];

const VIEWER_LINKS = [
  { to: "/listen", label: "האזנה" },
  { to: "/rooms", label: "החדרים שלי" },
  { to: "/stats", label: "סטטיסטיקות" },
  { to: "/beacons", label: "מחולל ביקונים", isBeta: true },
];

const ROLE_LABELS = {
  admin: "מנהל",
  viewer: "צופה",
};

const SideNav = ({
  user,
  isListening,
  analyser,
  silentCount,
  alerts,
  onAlertRead,
  onAllAlertsRead,
  onLogout,
}: SideNavProps) => {
  const visibleLinks = user.role === "admin" ? ADMIN_LINKS : VIEWER_LINKS;

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        <div className="brand">
          <Logo size={26} />
          <div>
            <b>UltraGuard</b>
            <small>שומר אולטרסוני</small>
          </div>
        </div>

        <div className="nav-links">
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
              {link.to === "/rooms" && silentCount > 0 && (
                <span className="nav-count">{silentCount}</span>
              )}
              {link.isBeta && <span className="nav-beta">(בטא)</span>}
            </NavLink>
          ))}
        </div>

        <div className="user-box">
          {isListening && (
            <span className="live on">
              <LiveWave analyser={analyser} />
            </span>
          )}
          <AlertsBell
            alerts={alerts}
            onRead={onAlertRead}
            onReadAll={onAllAlertsRead}
          />
          <span>
            {user.name} · {ROLE_LABELS[user.role]}
          </span>
          <button onClick={onLogout}>יציאה</button>
        </div>
      </div>
    </nav>
  );
};

export default SideNav;
