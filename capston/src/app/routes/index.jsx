import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import LandingPage from "../../pages/Landing/LandingPage";
import AnalyPage from "../../pages/Analy/AnalyPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/analyze", element: <AnalyPage /> },
    ],
  },
]);