import { NavLink } from "react-router-dom";
import type { User } from "../types/user";
import Logo from "./Logo";
import LiveWave from "./LiveWave";

interface SideNavProps {
  user: User;
  isListening: boolean;
  analyser: AnalyserNode | null;
  onLogout: () => void;
}

const LINKS = [
  { to: "/dashboard", label: "דשבורד", adminOnly: false },
  { to: "/listen", label: "האזנה", adminOnly: false },
  { to: "/beacons", label: "מחולל ביקונים", adminOnly: false },
  { to: "/admin", label: "ניהול", adminOnly: true },
];

const ROLE_LABELS = {
  admin: "מנהל",
  viewer: "צופה",
};

const SideNav = ({ user, isListening, analyser, onLogout }: SideNavProps) => {
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
            </NavLink>
          ))}
        </div>

        <div className="user-box">
          {isListening && (
            <span className="live on">
              <LiveWave analyser={analyser} />
            </span>
          )}
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
