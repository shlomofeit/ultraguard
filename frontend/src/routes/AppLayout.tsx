import { Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useListenerStore } from "../store/listenerStore";
import SideNav from "../components/SideNav";
import ListeningBar from "../components/ListeningBar";

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const setLogout = useAuthStore((state) => state.setLogout);
  const isListening = useListenerStore((state) => state.isListening);
  const isConnected = useListenerStore((state) => state.isConnected);
  const isRejected = useListenerStore((state) => state.isRejected);
  const detections = useListenerStore((state) => state.detections);
  const setStopListening = useListenerStore((state) => state.setStopListening);
  const location = useLocation();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    setStopListening();
    setLogout();
  };

  const isBarVisible = isListening && location.pathname !== "/listen";
  const suspiciousCount = detections.filter(
    (detection) => detection.suspicion,
  ).length;

  return (
    <div className="app-shell">
      <SideNav user={user} onLogout={handleLogout} />
      <Outlet />
      {isBarVisible && (
        <ListeningBar
          isOnline={isConnected && !isRejected}
          detectionsCount={detections.length}
          suspiciousCount={suspiciousCount}
          onStop={setStopListening}
        />
      )}
    </div>
  );
};

export default AppLayout;
