import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Github, LogIn, UserPlus } from "lucide-react";

import LoginModal from "../../../features/auth/components/LoginModal";
import SignupModal from "../../../features/auth/components/SignupModal";

export function Header() {
  const navigate = useNavigate();
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white font-bold tracking-wide"
        >
          <Github size={18} className="text-purple-300" />
          Oh! SS
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenLogin(true)}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <LogIn size={16} />
            로그인
          </button>

          <button
            onClick={() => setOpenSignup(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <UserPlus size={16} />
            회원가입
          </button>
        </div>
      </div>

      {openLogin && <LoginModal onClose={() => setOpenLogin(false)} />}
      {openSignup && <SignupModal onClose={() => setOpenSignup(false)} />}
    </header>
  );
}