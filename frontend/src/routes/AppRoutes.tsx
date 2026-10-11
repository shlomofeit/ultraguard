import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import BeaconGeneratorPage from "../pages/BeaconGeneratorPage";
import ListenPage from "../pages/ListenPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/beacons" element={<BeaconGeneratorPage />} />
        <Route path="/listen" element={<ListenPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
