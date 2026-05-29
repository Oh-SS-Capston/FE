import { AlertTriangle, Coins, X } from "lucide-react";
import { TOKEN_COST } from "../constants/tokenPolicy";

export default function InsufficientTokenModal({
  open,
  requiredTokens = TOKEN_COST.ANALYSIS,
  currentTokens = null,
  title = "토큰이 부족합니다.",
  description = "분석을 계속하려면 토큰을 충전해주세요.",
  onClose,
  onCharge,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="토큰 부족 모달 닫기"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-7 shadow-2xl shadow-purple-950/30">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200">
          <AlertTriangle size={28} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
            <Coins size={17} />
            필요 토큰
          </div>

          <p className="mt-2 text-2xl font-black text-white">
            {requiredTokens.toLocaleString()} T
          </p>

          {currentTokens !== null && currentTokens !== undefined && (
            <p className="mt-1 text-sm text-gray-500">
              현재 보유 토큰: {Number(currentTokens).toLocaleString()} T
            </p>
          )}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onCharge}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-gray-200"
          >
            토큰 충전하기
          </button>
        </div>
      </section>
    </div>
  );
}