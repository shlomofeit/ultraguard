import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useListenerStore } from "../store/listenerStore";
import { useRoomStatusStore } from "../store/roomStatusStore";
import SideNav from "../components/SideNav";
import ListeningBar from "../components/ListeningBar";
import Toasts from "../components/Toasts";

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const setLogout = useAuthStore((state) => state.setLogout);
  const isListening = useListenerStore((state) => state.isListening);
  const analyser = useListenerStore((state) => state.analyser);
  const isConnected = useListenerStore((state) => state.isConnected);
  const isRejected = useListenerStore((state) => state.isRejected);
  const detections = useListenerStore((state) => state.detections);
  const setStopListening = useListenerStore((state) => state.setStopListening);
  const statuses = useRoomStatusStore((state) => state.statuses);
  const alerts = useRoomStatusStore((state) => state.alerts);
  const setStatusLive = useRoomStatusStore((state) => state.setStatusLive);
  const setStopStatusLive = useRoomStatusStore(
    (state) => state.setStopStatusLive,
  );
  const setAlertRead = useRoomStatusStore((state) => state.setAlertRead);
  const setAllAlertsRead = useRoomStatusStore(
    (state) => state.setAllAlertsRead,
  );
  const location = useLocation();

  useEffect(() => {
    setStatusLive();
    return () => setStopStatusLive();
  }, [setStatusLive, setStopStatusLive]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    setStopListening();
    setStopStatusLive();
    setLogout();
  };

  const isBarVisible = isListening && location.pathname !== "/listen";
  const suspiciousCount = detections.filter(
    (detection) => detection.suspicion,
  ).length;
  const silentCount = statuses.filter(
    (status) => status.state === "silent",
  ).length;

  return (
    <div className="app-shell">
      <SideNav
        user={user}
        isListening={isListening}
        analyser={analyser}
        silentCount={silentCount}
        alerts={alerts}
        onAlertRead={setAlertRead}
        onAllAlertsRead={setAllAlertsRead}
        onLogout={handleLogout}
      />
      <Outlet />
      <Toasts />
      {isBarVisible && (
        <ListeningBar
          isOnline={isConnected && !isRejected}
          analyser={analyser}
          detectionsCount={detections.length}
          suspiciousCount={suspiciousCount}
          onStop={setStopListening}
        />
      )}
    </div>
  );
};

export default AppLayout;
