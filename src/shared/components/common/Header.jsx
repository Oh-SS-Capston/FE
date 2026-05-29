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
    <header className="sticky top-0 z-40 bg-[#000000]/50 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="h-20 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
        <div className="min-w-0" />

        <button
          onClick={() => navigate("/")}
          className="text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] justify-self-center hover:opacity-90 transition-opacity"
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
                className="hidden md:flex items-center gap-2 max-w-[180px] truncate rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <UserRound size={18} className="shrink-0" />
                <span className="truncate">{user?.name}님</span>
              </button>

              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2 rounded-full hover:bg-white/5 shrink-0"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpenLogin(true)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2 rounded-full hover:bg-white/5 shrink-0"
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