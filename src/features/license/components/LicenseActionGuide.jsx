import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Scale,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  buildLicenseViewModel,
  pickFirst,
} from "../model/licenseAnalysisModel";

function isCopyleftLicense(spdxId) {
  const normalized = String(spdxId ?? "").toUpperCase();
  return normalized.includes("GPL") || normalized.includes("AGPL");
}

function buildDecision(license) {
  if (license.spdxId === "UNKNOWN") {
    return {
      icon: ShieldAlert,
      title: "대표 라이선스를 확정하지 못했습니다.",
      description:
        "루트 라이선스 파일이나 README의 라이선스 문구를 직접 확인해야 합니다.",
      badge: "확인 필요",
      tone: "amber",
    };
  }

  if (license.manualReviewRequired) {
    return {
      icon: AlertTriangle,
      title: "자동 후보는 찾았지만 검토가 필요합니다.",
      description:
        "근거 충돌, 높은 검토 등급, 또는 주의 경고가 있어 결과를 바로 확정하지 않는 편이 좋습니다.",
      badge: "검토 필요",
      tone: "amber",
    };
  }

  if (isCopyleftLicense(license.spdxId)) {
    return {
      icon: Scale,
      title: "대표 라이선스 후보가 확인됐지만 배포 조건 확인이 중요합니다.",
      description:
        "GPL/AGPL 계열은 사용 방식에 따라 소스 공개나 네트워크 사용 조건 확인이 필요할 수 있습니다.",
      badge: "조건 확인",
      tone: "fuchsia",
    };
  }

  return {
    icon: ShieldCheck,
    title: "대표 라이선스 후보가 안정적으로 확인됐습니다.",
    description:
      "근거 파일과 SPDX ID를 마지막으로 확인한 뒤 프로젝트 설명에 표시하면 됩니다.",
    badge: "자동 판단 가능",
    tone: "emerald",
  };
}

function decisionToneClass(tone) {
  if (tone === "fuchsia") {
    return {
      panel: "border-fuchsia-300/25 bg-fuchsia-300/[0.07]",
      icon: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
      badge: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
      title: "text-fuchsia-50",
    };
  }

  if (tone === "amber") {
    return {
      panel: "border-amber-300/25 bg-amber-300/[0.07]",
      icon: "border-amber-300/30 bg-amber-300/10 text-amber-100",
      badge: "border-amber-300/30 bg-amber-300/10 text-amber-100",
      title: "text-amber-50",
    };
  }

  return {
    panel: "border-emerald-300/25 bg-emerald-300/[0.07]",
    icon: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    badge: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    title: "text-emerald-50",
  };
}

function buildActionItems(license) {
  const primaryEvidence = license.evidences[0];
  const primaryPath = pickFirst(
    primaryEvidence,
    ["path", "filePath", "file_path"],
    "근거 파일"
  );

  const items = [
    {
      icon: FileCheck2,
      label: "대표 근거 파일 확인",
      description:
        license.evidences.length > 0
          ? `${primaryPath} 기준으로 SPDX ID와 원문 문구가 맞는지 확인합니다.`
          : "연결된 근거 파일이 없으므로 LICENSE, README 파일을 직접 확인합니다.",
      status: license.evidences.length > 0 ? "권장" : "필수",
      accent: license.evidences.length > 0 ? "cyan" : "amber",
    },
    {
      icon: ClipboardCheck,
      label: "의무사항 반영 여부 확인",
      description:
        license.obligations.length > 0
          ? `${license.obligations.length}개의 의무사항을 배포 문서나 고지 파일에 반영합니다.`
          : "카탈로그에 등록된 별도 의무사항은 없습니다.",
      status: license.obligations.length > 0 ? "필수" : "확인",
      accent: license.obligations.length > 0 ? "amber" : "emerald",
    },
    {
      icon: SearchCheck,
      label: "검토 경고 처리",
      description:
        license.manualReviewRequired || license.warnings.length > 0
          ? "경고와 검토 항목을 확인하고 결과를 확정하기 전에 수동 검토합니다."
          : "현재 산출물 기준 검토 경고는 없습니다.",
      status:
        license.manualReviewRequired || license.warnings.length > 0
          ? "필수"
          : "완료",
      accent:
        license.manualReviewRequired || license.warnings.length > 0
          ? "amber"
          : "emerald",
    },
  ];

  if (license.notices.length > 0) {
    items.push({
      icon: Scale,
      label: "주의 안내 확인",
      description: `${license.notices.length}개의 주의 안내를 확인하고 서비스 제공/배포 방식에 맞게 판단합니다.`,
      status: "권장",
      accent: "cyan",
    });
  }

  return items;
}

function statusClass(accent) {
  if (accent === "amber") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (accent === "emerald") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function ActionItem({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-2 text-cyan-100">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-100">{item.label}</h4>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass(
                item.accent
              )}`}
            >
              {item.status}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            {item.description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function LicenseActionGuide({ analysis }) {
  if (!analysis) {
    return null;
  }

  const license = buildLicenseViewModel(analysis);
  const decision = buildDecision(license);
  const tone = decisionToneClass(decision.tone);
  const DecisionIcon = decision.icon;
  const actionItems = buildActionItems(license);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080817]/75 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
              <CheckCircle2 size={14} />
              Review Guide
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              검토 가이드
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              분석 결과를 실제 프로젝트 문서와 배포 준비에 반영하기 위한 다음
              행동을 정리했습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              SPDX
            </p>
            <p className="mt-1 break-all text-xl font-black text-slate-100">
              {license.spdxId}
            </p>
          </div>
        </div>

        <div className={`mt-5 rounded-2xl border p-5 ${tone.panel}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl border p-3 ${tone.icon}`}>
                <DecisionIcon size={21} />
              </div>

              <div>
                <h4 className={`text-lg font-black ${tone.title}`}>
                  {decision.title}
                </h4>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
                  {decision.description}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${tone.badge}`}
            >
              {decision.badge}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {actionItems.map((item) => (
            <ActionItem key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
