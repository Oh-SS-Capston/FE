import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function SignupModal({ onClose }) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 백엔드 API 연결 시 여기서 호출
    alert(`회원가입: ${nickname} / ${email}`);
    onClose();
  };

  const inputClass =
    "w-full bg-white/[0.06] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-title"
    >
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a1a]/90 shadow-[0_0_50px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden">
        {/* 상단 글로우 라인 */}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signup-nickname" className="block text-sm font-medium text-gray-400 mb-2">
                닉네임
              </label>
              <input
                id="signup-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className={inputClass}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-400 mb-2">
                이메일
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-400 mb-2">
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className={inputClass}
                autoComplete="new-password"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all active:scale-[0.98]"
              >
                가입하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
