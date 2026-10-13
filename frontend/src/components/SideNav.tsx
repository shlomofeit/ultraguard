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

const LINKS = [
  { to: "/rooms", label: "מפת חדרים", adminOnly: false },
  { to: "/dashboard", label: "דשבורד", adminOnly: false },
  { to: "/listen", label: "האזנה", adminOnly: false },
  { to: "/admin", label: "ניהול", adminOnly: true },
  { to: "/beacons", label: "מחולל ביקונים", adminOnly: false, isBeta: true },
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
  const visibleLinks = LINKS.filter(
    (link) => !link.adminOnly || user.role === "admin",
  );

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
