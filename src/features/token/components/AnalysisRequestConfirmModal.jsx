import { AlertTriangle, Coins, GitBranch, X } from "lucide-react";
import { TOKEN_COST } from "../constants/tokenPolicy";

export default function AnalysisRequestConfirmModal({
  open,
  repoLabel,
  currentTokens = 0,
  loading = false,
  onClose,
  onConfirm,
  onCharge,
}) {
  if (!open) {
    return null;
  }

  const requiredTokens = TOKEN_COST.ANALYSIS;
  const hasEnoughTokens = currentTokens >= requiredTokens;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="분석 요청 확인 모달 닫기"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-7 shadow-2xl shadow-purple-950/30">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-400/15 text-purple-200">
          <GitBranch size={28} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          이 레포지토리를 분석할까요?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          분석을 시작하면 {requiredTokens.toLocaleString()}토큰이 차감됩니다.
          분석 요청 후에는 파이프라인이 자동으로 실행됩니다.
        </p>

        <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div>
            <p className="text-sm font-semibold text-gray-400">
              분석 대상 레포지토리
            </p>
            <p className="mt-1 break-all text-base font-bold text-white">
              {repoLabel || "-"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Coins size={14} />
                차감 토큰
              </div>
              <p className="mt-1 text-lg font-black text-white">
                {requiredTokens.toLocaleString()} T
              </p>
            </div>

            <div className="rounded-xl  p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Coins size={14} />
                현재 토큰
              </div>
              <p
                className={`mt-1 text-lg font-black ${
                  hasEnoughTokens ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {Number(currentTokens || 0).toLocaleString()} T
              </p>
            </div>
          </div>
        </div>

        {!hasEnoughTokens && (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 shrink-0 text-amber-200"
                size={18}
              />
              <p className="text-sm leading-6 text-amber-100/90">
                토큰이 부족합니다. 분석을 시작하려면 토큰을 충전해주세요.
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>

          {hasEnoughTokens ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "분석 요청 중..." : "분석 시작"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCharge}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-gray-200"
            >
              토큰 충전하기
            </button>
          )}
        </div>
      </section>
    </div>
  );
}