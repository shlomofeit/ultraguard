import { useLayoutEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { User } from "../types/user";
import Logo from "./Logo";

interface SideNavProps {
  user: User;
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

const SideNav = ({ user, onLogout }: SideNavProps) => {
  const linksRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const location = useLocation();

  const visibleLinks = LINKS.filter(
    (link) => !link.adminOnly || user.role === "admin",
  );

  useLayoutEffect(() => {
    const active = linksRef.current?.querySelector<HTMLElement>("a.active");
    const pill = pillRef.current;
    if (!pill) {
      return;
    }
    pill.style.opacity = active ? "1" : "0";
    pill.style.transform = `translateY(${active?.offsetTop ?? 0}px)`;
  }, [location.pathname]);

  return (
    <nav className="side-nav">
      <div className="brand">
        <Logo />
        <div>
          <b>UltraGuard</b>
          <small>שומר אולטרסוני</small>
        </div>
      </div>

      <div className="nav-links" ref={linksRef}>
        <span className="nav-pill" ref={pillRef} />
        {visibleLinks.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="user-box">
        <span className="avatar">{user.name.charAt(0)}</span>
        <div>
          {user.name}
          <small>{ROLE_LABELS[user.role]}</small>
        </div>
        <button onClick={onLogout}>יציאה</button>
      </div>
    </nav>
  );
};

export default SideNav;
