import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogIn, X } from "lucide-react";
import { useAuth } from "../model/AuthContext";

export default function LoginModal({ onClose }) {
  const { loginWithGoogle } = useAuth();

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
      aria-labelledby="login-title"
    >
      <div
        className="fixed inset-0 bg-black/65"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2
              id="login-title"
              className="text-xl font-semibold text-[var(--text-primary)]"
            >
              로그인
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

          <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-400">
            Google 계정으로 로그인하면<br className="hidden sm:block" />
            OSS 분석 요청을 생성할 수 있습니다.
          </p>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-200 active:scale-[0.98]"
          >
            <LogIn size={18} />
            Google로 로그인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
