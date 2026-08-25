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
        className="fixed inset-0 bg-black/65"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative my-auto w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2
              id="signup-title"
              className="text-xl font-semibold text-[var(--text-primary)]"
            >
              회원가입
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-200 active:scale-[0.98]"
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
