import { RefreshCw, X } from "lucide-react";
import { TOKEN_COST } from "../constants/tokenPolicy";

export default function ReanalysisConfirmModal({
  open,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="재분석 확인 모달 닫기"
        className="absolute inset-0 bg-black/70"
        onClick={loading ? undefined : onClose}
      />

      <section className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 rounded-lg p-2 text-gray-400 transition hover:bg-[var(--surface-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-400/15 text-purple-200">
          <RefreshCw size={28} />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          재분석을 요청할까요?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          재분석은 기존 캐시 결과를 재사용하지 않고 새 분석을 요청합니다.
          재분석 요청 시 {TOKEN_COST.REANALYSIS.toLocaleString()}토큰이
          차감됩니다.
        </p>

        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
          <p className="text-sm font-semibold text-gray-400">차감 토큰</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {TOKEN_COST.REANALYSIS.toLocaleString()} T
          </p>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-[var(--surface-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "재분석 요청 중..." : "재분석 요청"}
          </button>
        </div>
      </section>
    </div>
  );
}
