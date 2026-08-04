import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useLicenseReviewChecklist } from "../hooks/useLicenseReviewChecklist";
import {
  buildLicenseChecklistStorageKey,
  buildLicenseReviewChecklist,
  calculateChecklistProgress,
} from "../model/licenseReviewChecklistModel";

function priorityClass(priority) {
  if (priority === "필수") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (priority === "권장") {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }

  return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
}

function categoryIcon(category) {
  if (category === "evidence") {
    return FileCheck2;
  }

  if (category === "policy") {
    return Scale;
  }

  if (category === "review") {
    return AlertTriangle;
  }

  return ShieldCheck;
}

function ChecklistItem({ item, checked, onToggle }) {
  const Icon = categoryIcon(item.category);

  return (
    <label
      className={`group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
        checked
          ? "border-emerald-300/25 bg-emerald-300/[0.07]"
          : "border-white/10 bg-black/20 hover:border-cyan-300/25 hover:bg-cyan-300/[0.045]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        className="sr-only"
      />

      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
          checked
            ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100"
            : "border-white/15 bg-white/[0.04] text-transparent group-hover:border-cyan-300/35"
        }`}
      >
        <CheckCircle2 size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 font-black text-slate-100">
            <Icon size={17} className={checked ? "text-emerald-100" : "text-cyan-100"} />
            {item.label}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${priorityClass(
              item.priority
            )}`}
          >
            {item.priority}
          </span>
        </span>

        <span className="mt-2 block text-sm leading-6 text-gray-400">
          {item.description}
        </span>
      </span>
    </label>
  );
}

export default function LicenseReviewChecklist({ analysis, runId, repo }) {
  const items = useMemo(() => buildLicenseReviewChecklist(analysis), [analysis]);
  const storageKey = useMemo(
    () => buildLicenseChecklistStorageKey({ runId, repo, analysis }),
    [analysis, repo, runId]
  );
  const { checkedIds, toggleItem, resetChecklist } = useLicenseReviewChecklist(
    storageKey,
    items
  );
  const progress = useMemo(
    () => calculateChecklistProgress(items, checkedIds),
    [checkedIds, items]
  );

  if (!analysis) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080817]/75 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
              <ClipboardCheck size={14} />
              Review Checklist
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              수동 검토 체크리스트
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              대표 라이선스 확정 전에 확인할 작업을 runId 기준으로 기록합니다.
            </p>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Completed
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-100">
                {progress.completed}/{progress.total}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-black text-cyan-100">
                {progress.remaining}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-gray-500">
                {progress.percent}% 완료
              </p>
            </div>

            <button
              type="button"
              onClick={resetChecklist}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <RotateCcw size={14} />
              초기화
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              checked={checkedIds.has(item.id)}
              onToggle={toggleItem}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
