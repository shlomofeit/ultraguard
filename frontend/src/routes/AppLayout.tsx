import { Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SideNav from "../components/SideNav";

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const setLogout = useAuthStore((state) => state.setLogout);

  if (!user) {
    return null;
  }

  return (
    <div className="app-shell">
      <SideNav user={user} onLogout={setLogout} />
      <Outlet />
    </div>
  );
};

export default AppLayout;
