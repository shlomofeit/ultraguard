import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setupSessionRefresh } from "./api/auth.api";

setupSessionRefresh();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
