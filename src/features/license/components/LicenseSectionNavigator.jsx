import {
  ShieldCheck,
} from "lucide-react";
import { buildLicenseViewModel } from "../model/licenseAnalysisModel";

const NAV_ITEMS = [
  {
    id: "license-summary",
    label: "요약",
  },
  {
    id: "license-guide",
    label: "검토 가이드",
  },
  {
    id: "license-checklist",
    label: "체크리스트",
  },
  {
    id: "license-evidence",
    label: "근거 탐색",
  },
];

function StatBadge({ label, value, tone = "text-slate-100" }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function NavItem({ item }) {
  return (
    <a
      href={`#${item.id}`}
      className="shrink-0 rounded-md px-2 py-1.5 text-sm font-semibold text-gray-400 transition hover:bg-[var(--surface-hover)] hover:text-cyan-100"
    >
      {item.label}
    </a>
  );
}

export default function LicenseSectionNavigator({ analysis }) {
  const license = analysis ? buildLicenseViewModel(analysis) : null;
  const visibleItems = license
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.id === "license-summary");
  const reviewTone = license?.manualReviewRequired
    ? "text-amber-100"
    : "text-emerald-100";

  return (
    <nav className="sticky top-4 z-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            <ShieldCheck size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">라이선스 보기</p>
            <p className="text-xs text-gray-500">필요한 검토 영역으로 바로 이동</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 xl:justify-end">
          <StatBadge
            label="SPDX"
            value={license?.spdxId ?? "대기 중"}
            tone="text-cyan-100"
          />
          <StatBadge
            label="검토 상태"
            value={
              license
                ? license.manualReviewRequired
                  ? "검토 필요"
                  : "자동 판단"
                : "대기 중"
            }
            tone={license ? reviewTone : "text-slate-100"}
          />
          <StatBadge
            label="근거"
            value={license ? `${license.evidences.length}개` : "대기 중"}
            tone="text-slate-100"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {visibleItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
}
