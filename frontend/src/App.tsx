import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/authStore";

const App = () => {
  const setCheckAuth = useAuthStore((state) => state.setCheckAuth);

  useEffect(() => {
    setCheckAuth();
  }, [setCheckAuth]);

  return <AppRoutes />;
};

export default App;
