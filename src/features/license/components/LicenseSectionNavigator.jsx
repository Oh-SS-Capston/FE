import { ClipboardCheck, FileSearch, Gauge, ShieldCheck } from "lucide-react";
import { buildLicenseViewModel } from "../model/licenseAnalysisModel";

const NAV_ITEMS = [
  {
    id: "license-summary",
    label: "요약",
    description: "대표 SPDX와 검토 등급",
    icon: Gauge,
  },
  {
    id: "license-guide",
    label: "검토 가이드",
    description: "다음 행동 체크리스트",
    icon: ClipboardCheck,
  },
  {
    id: "license-evidence",
    label: "근거 탐색",
    description: "파일 근거 검색과 필터",
    icon: FileSearch,
  },
];

function StatBadge({ label, value, tone = "text-slate-100" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-black ${tone}`}>{value}</p>
    </div>
  );
}

function NavItem({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={`#${item.id}`}
      className="group flex min-w-[190px] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition group-hover:border-cyan-300/40">
        <Icon size={17} />
      </span>

      <span className="min-w-0">
        <span className="block font-bold text-slate-100">{item.label}</span>
        <span className="mt-0.5 block truncate text-xs text-gray-500">
          {item.description}
        </span>
      </span>
    </a>
  );
}

export default function LicenseSectionNavigator({ analysis }) {
  const license = analysis ? buildLicenseViewModel(analysis) : null;
  const reviewTone = license?.manualReviewRequired
    ? "text-amber-100"
    : "text-emerald-100";

  return (
    <nav className="sticky top-4 z-20 rounded-[1.5rem] border border-white/10 bg-[#080817]/85 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            <ShieldCheck size={17} />
          </span>
          <div>
            <p className="text-sm font-black text-white">라이선스 보기</p>
            <p className="text-xs text-gray-500">필요한 검토 영역으로 바로 이동</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[440px]">
          <StatBadge
            label="SPDX"
            value={license?.spdxId ?? "대기 중"}
            tone="text-cyan-100"
          />
          <StatBadge
            label="Review"
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
            label="Evidence"
            value={license ? `${license.evidences.length}개` : "대기 중"}
            tone="text-slate-100"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
}
