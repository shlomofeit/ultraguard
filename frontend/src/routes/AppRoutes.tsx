import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import BeaconGeneratorPage from "../pages/BeaconGeneratorPage";
import ListenPage from "../pages/ListenPage";
import DashboardPage from "../pages/DashboardPage";
import ProtectedRoute from "./ProtectedRoutes";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route index element={<Navigate to="/" />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/beacons" element={<BeaconGeneratorPage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
