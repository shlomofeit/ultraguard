import { Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useListenerStore } from "../store/listenerStore";
import SideNav from "../components/SideNav";

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const setLogout = useAuthStore((state) => state.setLogout);
  const setStopListening = useListenerStore((state) => state.setStopListening);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    setStopListening();
    setLogout();
  };

  return (
    <div className="app-shell">
      <SideNav user={user} onLogout={handleLogout} />
      <Outlet />
    </div>
  );
};

export default AppLayout;
