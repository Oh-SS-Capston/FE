import {
  AlertTriangle,
  BadgeCheck,
  FileSearch,
  FileText,
  Info,
  Sparkles,
} from "lucide-react";
import {
  buildLicenseViewModel,
  formatPercent,
  formatReviewLevel,
  pickFirst,
} from "../model/licenseAnalysisModel";
import LicenseDetailList from "./LicenseDetailList";
import LicenseEvidenceCard from "./LicenseEvidenceCard";
import LicenseReviewNotice from "./LicenseReviewNotice";

function emptyStateToneClass(tone) {
  if (tone === "danger") {
    return {
      border: "border-red-400/25",
      bg: "bg-red-950/10",
      icon: "border-red-300/25 bg-red-300/10 text-red-100",
      badge: "border-red-300/25 bg-red-300/10 text-red-100",
    };
  }

  if (tone === "warning") {
    return {
      border: "border-amber-300/25",
      bg: "bg-amber-300/[0.055]",
      icon: "border-amber-300/25 bg-amber-300/10 text-amber-100",
      badge: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    };
  }

  return {
    border: "border-cyan-300/20",
    bg: "bg-cyan-300/[0.045]",
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    badge: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  };
}

function LicenseEmptyState({ state }) {
  const resolvedState = state ?? {
    tone: "info",
    title: "대표 라이선스 분석 산출물을 기다리는 중입니다.",
    description: "분석이 완료되면 대표 라이선스 결과가 표시됩니다.",
    badge: "대기 중",
  };
  const tone = emptyStateToneClass(resolvedState.tone);
  const Icon = resolvedState.tone === "danger" ? AlertTriangle : Info;

  return (
    <section
      className={`overflow-hidden rounded-xl border ${tone.border} ${tone.bg}`}
    >
      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl border p-3 ${tone.icon}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{resolvedState.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
                {resolvedState.description}
              </p>
            </div>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${tone.badge}`}
          >
            {resolvedState.badge}
          </span>
        </div>
      </div>
    </section>
  );
}

function LicenseLoadingState() {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="animate-pulse space-y-5">
        <div className="h-5 w-48 rounded bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="h-44 rounded-2xl bg-white/[0.06] lg:col-span-2" />
          <div className="h-44 rounded-2xl bg-white/[0.04]" />
          <div className="h-44 rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </section>
  );
}

function LicenseErrorState({ error }) {
  return (
    <section className="rounded-xl border border-red-400/20 bg-red-950/10 p-6">
      <div className="flex items-start gap-3 text-red-100">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold">
            라이선스 분석 결과를 불러오지 못했습니다.
          </h3>
          <p className="mt-1 text-sm text-red-100/75">{error}</p>
        </div>
      </div>
    </section>
  );
}

function LicenseSummary({ license }) {
  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Detected SPDX
          </p>
          <p className={`mt-1 break-all text-3xl font-semibold ${license.tone.text}`}>
            {license.spdxId}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {license.displayName}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400 xl:justify-end">
          <span>
            신뢰도{" "}
            <span className="font-semibold text-cyan-100">
              {formatPercent(license.confidence)}
            </span>
          </span>
          <span className="hidden h-1 w-1 self-center rounded-full bg-gray-600 sm:inline-block" />
          <span>
            검토 등급{" "}
            <span
              className={`font-semibold ${
                license.manualReviewRequired ? "text-amber-100" : "text-emerald-100"
              }`}
            >
              {formatReviewLevel(license.reviewLevel)}
            </span>
          </span>
          <span className="hidden h-1 w-1 self-center rounded-full bg-gray-600 sm:inline-block" />
          <span>
            라이선스 계열 <span className="font-semibold text-slate-200">{license.family}</span>
          </span>
        </div>
      </div>

      {license.summary && (
        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-400">
          {license.summary}
        </p>
      )}
    </div>
  );
}

export default function LicenseAnalysisSection({
  artifactId,
  analysis,
  loading,
  error,
  actions,
  emptyState,
}) {
  if (!artifactId && !analysis && !loading && !error) {
    return <LicenseEmptyState state={emptyState} />;
  }

  if (loading) {
    return <LicenseLoadingState />;
  }

  if (error) {
    return <LicenseErrorState error={error} />;
  }

  const license = buildLicenseViewModel(analysis);

  return (
    <section
      className={`overflow-hidden rounded-xl border ${license.tone.border} bg-[var(--surface)]`}
    >

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
                <Sparkles size={14} />
                License Intelligence
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                {license.analysisScope}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
              대표 라이선스 분석
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              저장소 루트의 LICENSE, README, pom.xml, build.gradle 근거를
              바탕으로 프로젝트 대표 라이선스를 판단합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`w-fit rounded-full border px-4 py-2 text-sm font-medium ${license.tone.chip}`}
            >
              {license.manualReviewRequired ? "검토 필요" : "자동 판단 가능"}
            </div>

            {actions}
          </div>
        </div>

        <LicenseSummary license={license} />

        <LicenseReviewNotice
          warnings={license.warnings}
          reviewItems={license.reviewItems}
        />

        <div className="mt-5 grid gap-x-8 gap-y-5 lg:grid-cols-3">
          <LicenseDetailList
            title="허용되는 대표 행위"
            items={license.permissions}
            emptyText="카탈로그에 등록된 허용 행위가 없습니다."
          />
          <LicenseDetailList
            title="지켜야 할 의무"
            items={license.obligations}
            emptyText="카탈로그에 등록된 의무가 없습니다."
          />
          <LicenseDetailList
            title="주의 안내"
            items={license.notices}
            emptyText="별도 주의 안내가 없습니다."
          />
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FileSearch size={18} className="text-cyan-100" />
              <div>
                <h4 className="font-semibold text-white">판단 근거</h4>
                <p className="text-sm text-gray-500">
                  {license.evidences.length}개의 파일 근거가 연결되었습니다.
                </p>
              </div>
            </div>

            {artifactId && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                artifact #{artifactId}
              </span>
            )}
          </div>

          {license.evidences.length > 0 ? (
            <div className="mt-4">
              {license.evidences.map((evidence, index) => (
                <LicenseEvidenceCard
                  key={pickFirst(
                    evidence,
                    ["evidenceId", "id"],
                    `evidence-${index}`
                  )}
                  evidence={evidence}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 py-5 text-sm text-gray-500">
              <FileText size={18} className="mb-2 text-gray-400" />
              연결된 근거 파일이 없습니다. 이 경우 UNKNOWN 또는 검토 필요
              결과일 수 있습니다.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <BadgeCheck size={14} className="text-cyan-300" />
          <span>schema {license.schemaVersion}</span>
          {license.generatedAt && (
            <span>
              generated {new Date(license.generatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
