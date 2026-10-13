import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

const ProtectedRoute = ({ adminOnly }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const isChecked = useAuthStore((state) => state.isChecked);
  const location = useLocation();

  if (!isChecked) {
    return <p className="page-loading">טוען...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
