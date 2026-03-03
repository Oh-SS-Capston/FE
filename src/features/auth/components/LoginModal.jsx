import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function LoginModal({ onClose }) {
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
    alert(`로그인 시도: ${email}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="relative w-[420px] rounded-2xl border border-white/10 bg-[#0a0a1a]/90 p-6 text-white shadow-[0_0_40px_rgba(124,58,237,0.25)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 hover:bg-white/10"
        >
          <X size={18} />
        </button>

        <h2 className="mb-6 text-2xl font-bold">로그인</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-white/70">이메일</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-purple-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">비밀번호</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 p-3 font-semibold hover:opacity-90">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}