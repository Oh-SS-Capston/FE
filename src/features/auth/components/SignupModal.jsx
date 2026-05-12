import { useEffect } from "react";
import { createPortal } from "react-dom";
import { UserPlus, X } from "lucide-react";
import { useAuth } from "../model/AuthContext";

export default function SignupModal({ onClose }) {
  const { signupWithGoogle } = useAuth();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a1a]/90 shadow-[0_0_50px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-60"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
          }}
        />

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2
              id="signup-title"
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
            >
              회원가입
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mb-6 text-sm text-gray-400 leading-relaxed">
            별도 회원가입 없이 Google 계정으로 시작할 수 있습니다.
          </p>

          <button
            type="button"
            onClick={signupWithGoogle}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Google 계정으로 시작하기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
