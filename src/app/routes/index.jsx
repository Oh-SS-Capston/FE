import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import LandingPage from "../../pages/Landing/LandingPage";
import AnalyPage from "../../pages/Analy/AnalyPage";
import GithubStatsPage from "../../pages/GithubStats/GithubStatsPage";
import LoginSuccessPage from "../../pages/Auth/LoginSuccessPage";
import LoginFailurePage from "../../pages/Auth/LoginFailurePage";
import AuthRequiredPage from "../../pages/Auth/AuthRequiredPage";
import MyPage from "../../pages/MyPage/MyPage";
import { useAuth } from "../../features/auth/model/AuthContext";

function ProtectedRoute({ children }) {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-gray-300">
          로그인 상태 확인 중...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <AuthRequiredPage />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/analyze",
        element: (
          <ProtectedRoute>
            <AnalyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/github-stats",
        element: (
          <ProtectedRoute>
            <GithubStatsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/mypage",
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/login/success",
        element: <LoginSuccessPage />,
      },
      {
        path: "/login/failure",
        element: <LoginFailurePage />,
      },
    ],
  },
]);