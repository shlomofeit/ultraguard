import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const HomeRedirect = () => {
  const user = useAuthStore((state) => state.user);

  return <Navigate to={user?.role === "admin" ? "/rooms" : "/listen"} replace />;
};

export default HomeRedirect;
