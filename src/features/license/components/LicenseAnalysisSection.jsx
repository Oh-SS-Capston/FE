import {
  AlertTriangle,
  BadgeCheck,
  FileSearch,
  FileText,
  Gauge,
  Info,
  Scale,
  ShieldCheck,
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
import LicenseMetricCard from "./LicenseMetricCard";
import LicenseReviewNotice from "./LicenseReviewNotice";

function LicenseEmptyState() {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080817]/70 backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <Info size={18} />
          <span>대표 라이선스 분석 산출물을 기다리는 중입니다.</span>
        </div>
      </div>
    </section>
  );
}

function LicenseLoadingState() {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080817]/70 p-6 backdrop-blur-xl">
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
    <section className="rounded-[1.75rem] border border-red-400/20 bg-red-950/10 p-6 backdrop-blur-xl">
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

function LicenseHeroCard({ license }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${license.tone.border} bg-gradient-to-br ${license.tone.bg} p-6 xl:col-span-2`}
    >
      <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.05] p-3 text-white/70">
        <ShieldCheck size={22} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">
        Detected SPDX
      </p>
      <p
        className={`mt-4 break-all text-5xl font-black leading-none ${license.tone.text} md:text-6xl`}
      >
        {license.spdxId}
      </p>
      <p className="mt-4 text-lg font-semibold text-slate-100">
        {license.displayName}
      </p>

      {license.summary && (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
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
}) {
  if (!artifactId && !analysis && !loading && !error) {
    return <LicenseEmptyState />;
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
      className={`overflow-hidden rounded-[1.75rem] border ${license.tone.border} bg-[#080817]/75 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl`}
    >
      <div className={`h-1 bg-gradient-to-r ${license.tone.bg}`} />

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

            <h3 className="mt-4 text-2xl font-black text-white md:text-3xl">
              대표 라이선스 분석
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              저장소 루트의 LICENSE, README, pom.xml, build.gradle 근거를
              바탕으로 프로젝트 대표 라이선스를 판단합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`w-fit rounded-full border px-4 py-2 text-sm font-black ${license.tone.chip}`}
            >
              {license.manualReviewRequired ? "검토 필요" : "자동 판단 가능"}
            </div>

            {actions}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <LicenseHeroCard license={license} />

          <LicenseMetricCard
            icon={Gauge}
            label="Confidence"
            value={formatPercent(license.confidence)}
            hint="근거 파일과 매칭 강도 기준"
            tone="text-cyan-100"
          />

          <LicenseMetricCard
            icon={Scale}
            label="Review"
            value={formatReviewLevel(license.reviewLevel)}
            hint={`family: ${license.family}`}
            tone={
              license.manualReviewRequired
                ? "text-amber-100"
                : "text-emerald-100"
            }
          />
        </div>

        <LicenseReviewNotice
          warnings={license.warnings}
          reviewItems={license.reviewItems}
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
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
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-100">
                <FileSearch size={18} />
              </div>
              <div>
                <h4 className="font-black text-white">판단 근거</h4>
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
            <div className="mt-4 grid gap-3">
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
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm text-gray-500">
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
