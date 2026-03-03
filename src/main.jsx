import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared/styles/globals.css";
import { AppProviders } from "./app/providers/AppProviders.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
);