import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserRound } from "lucide-react";

import LoginModal from "../../../features/auth/components/LoginModal";
import { useAuth } from "../../../features/auth/model/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const { user, authLoading, isAuthenticated, logout } = useAuth();

  const [openLogin, setOpenLogin] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95">
      <div className="h-20 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
        <div className="min-w-0" />

        <button
          onClick={() => navigate("/")}
          className="justify-self-center text-3xl font-semibold tracking-wide text-[var(--text-primary)] transition-colors hover:text-cyan-200"
        >
          Oh! SS
        </button>

        <div className="flex items-center justify-end gap-4 min-w-0">
          {authLoading ? (
            <span className="text-sm text-gray-400">확인 중...</span>
          ) : isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => navigate("/mypage")}
                className="hidden max-w-[180px] items-center gap-2 truncate rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:flex"
              >
                <UserRound size={18} className="shrink-0" />
                <span className="truncate">{user?.name}님</span>
              </button>

              <button
                onClick={logout}
                className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpenLogin(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              <LogIn size={18} />
              Google 계정으로 시작하기
            </button>
          )}
        </div>
      </div>

      {openLogin && <LoginModal onClose={() => setOpenLogin(false)} />}
    </header>
  );
}
