import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = () => {
  const user = useAuthStore((state) => state.user);
  const isChecked = useAuthStore((state) => state.isChecked);

  if (!isChecked) {
    return <p>טוען...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
