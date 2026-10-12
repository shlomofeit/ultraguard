import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

const ProtectedRoute = ({ adminOnly }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const isChecked = useAuthStore((state) => state.isChecked);

  if (!isChecked) {
    return <p>טוען...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
