import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";

import LoginModal from "../../../features/auth/components/LoginModal";
import SignupModal from "../../../features/auth/components/SignupModal";

export function Header() {
  const navigate = useNavigate();
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#000000]/50 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="h-20 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
        {/* 왼쪽 빈 영역 (로고 중앙 정렬용) */}
        <div className="min-w-0" />

        {/* 로고: 항상 화면 정중앙 */}
        <button
          onClick={() => navigate("/")}
          className="text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] justify-self-center hover:opacity-90 transition-opacity"
        >
          Oh! SS
        </button>

        {/* 오른쪽: 로그인, 회원가입 */}
        <div className="flex items-center justify-end gap-4 min-w-0">
          <button
            onClick={() => setOpenLogin(true)}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2 rounded-full hover:bg-white/5 shrink-0"
          >
            <LogIn size={18} /> 로그인
          </button>

          <button
            onClick={() => setOpenSignup(true)}
            className="group relative px-5 py-2 text-sm font-bold rounded-full overflow-hidden shrink-0"
          >
            <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-r from-cyan-500 to-purple-600 group-hover:opacity-100 blur-[2px]" />
            <span className="absolute inset-0 w-full h-full border border-white/20 rounded-full group-hover:border-transparent transition duration-300" />
            <span className="relative flex items-center gap-2 text-white group-hover:text-white">
              <UserPlus size={18} /> 회원가입
            </span>
          </button>
        </div>
      </div>

      {openLogin && <LoginModal onClose={() => setOpenLogin(false)} />}
      {openSignup && <SignupModal onClose={() => setOpenSignup(false)} />}
    </header>
  );
}
