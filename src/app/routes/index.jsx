import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import LandingPage from "../../pages/Landing/LandingPage";
import AnalyPage from "../../pages/Analy/AnalyPage";
import LoginSuccessPage from "../../pages/Auth/LoginSuccessPage";
import LoginFailurePage from "../../pages/Auth/LoginFailurePage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/analyze", element: <AnalyPage /> },
      { path: "/login/success", element: <LoginSuccessPage /> },
      { path: "/login/failure", element: <LoginFailurePage /> },
    ],
  },
]);