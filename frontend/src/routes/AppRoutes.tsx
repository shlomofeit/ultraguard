import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BeaconGeneratorPage from "../pages/BeaconGeneratorPage";
import ListenPage from "../pages/ListenPage";
import DashboardPage from "../pages/DashboardPage";
import ProtectedRoute from "./ProtectedRoutes";
import AppLayout from "./AppLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AdminPage from "../pages/AdminPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/beacons" element={<BeaconGeneratorPage />} />
            <Route path="/listen" element={<ListenPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
