import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  FileSearch,
  FileText,
  Gauge,
  Info,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickFirst(obj, keys, fallback = null) {
  if (!isRecord(obj)) {
    return fallback;
  }

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }

  return fallback;
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }

  return `${Math.round(Math.max(0, Math.min(1, number)) * 100)}%`;
}

function normalizeLicenseAnalysis(raw) {
  const source = isRecord(raw) ? raw : {};
  const projectLicense = pickFirst(source, ["projectLicense", "project_license"], {});
  const displayPolicy = pickFirst(source, ["displayPolicy", "display_policy"], {});

  return {
    schemaVersion: pickFirst(source, ["schemaVersion", "schema_version"], "-"),
    generatedAt: pickFirst(source, ["generatedAt", "generated_at"], null),
    analysisScope: pickFirst(source, ["analysisScope", "analysis_scope"], "-"),
    projectLicense: isRecord(projectLicense) ? projectLicense : {},
    displayPolicy: isRecord(displayPolicy) ? displayPolicy : {},
    reviewItems: safeArray(pickFirst(source, ["reviewItems", "review_items"], [])),
    evidences: safeArray(pickFirst(source, ["evidences", "evidenceList", "evidence_list"], [])),
  };
}

function licenseTone(spdxId, manualReviewRequired) {
  if (manualReviewRequired || spdxId === "UNKNOWN") {
    return {
      border: "border-amber-300/30",
      bg: "from-amber-300/15 via-orange-400/10 to-transparent",
      text: "text-amber-100",
      chip: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    };
  }

  if (String(spdxId).includes("GPL") || String(spdxId).includes("AGPL")) {
    return {
      border: "border-fuchsia-300/30",
      bg: "from-fuchsia-300/15 via-purple-400/10 to-transparent",
      text: "text-fuchsia-100",
      chip: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
    };
  }

  return {
    border: "border-emerald-300/30",
    bg: "from-emerald-300/15 via-cyan-300/10 to-transparent",
    text: "text-emerald-100",
    chip: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  };
}

function formatReviewLevel(level) {
  switch (String(level ?? "").toUpperCase()) {
    case "LOW":
      return "낮음";
    case "MEDIUM":
      return "보통";
    case "HIGH":
      return "높음";
    default:
      return level || "-";
  }
}

function EvidenceCard({ evidence, index }) {
  const evidenceId = pickFirst(evidence, ["evidenceId", "id"], `evidence-${index + 1}`);
  const path = pickFirst(evidence, ["path", "filePath", "file_path"], "unknown path");
  const startLine = pickFirst(evidence, ["startLine", "start_line"], null);
  const endLine = pickFirst(evidence, ["endLine", "end_line"], null);
  const source = pickFirst(evidence, ["source", "sourceType", "source_type"], "ROOT_FILE");
  const type = pickFirst(evidence, ["evidenceType", "evidence_type", "type"], "LICENSE_EVIDENCE");
  const snippet = pickFirst(evidence, ["snippet", "contextSnippet", "context_snippet"], "");

  const lineLabel =
    startLine && endLine
      ? startLine === endLine
        ? `L${startLine}`
        : `L${startLine}-L${endLine}`
      : "line -";

  return (
    <article className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100">
              {evidenceId}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-gray-300">
              {source}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-gray-400">
              {type}
            </span>
          </div>

          <p className="mt-3 break-all font-mono text-sm text-slate-100">{path}</p>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-gray-300">
          {lineLabel}
        </span>
      </div>

      {snippet && (
        <blockquote className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-gray-300">
          {snippet}
        </blockquote>
      )}
    </article>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone = "text-cyan-100" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-black ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function DetailList({ title, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h4 className="text-sm font-bold text-slate-100">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-5 text-gray-300">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}

export default function LicenseAnalysisSection({
  artifactId,
  analysis,
  loading,
  error,
}) {
  if (!artifactId && !analysis && !loading && !error) {
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

  if (loading) {
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

  if (error) {
    return (
      <section className="rounded-[1.75rem] border border-red-400/20 bg-red-950/10 p-6 backdrop-blur-xl">
        <div className="flex items-start gap-3 text-red-100">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold">라이선스 분석 결과를 불러오지 못했습니다.</h3>
            <p className="mt-1 text-sm text-red-100/75">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  const normalized = normalizeLicenseAnalysis(analysis);
  const projectLicense = normalized.projectLicense;
  const displayPolicy = normalized.displayPolicy;

  const spdxId = pickFirst(projectLicense, ["spdxId", "spdx_id"], "UNKNOWN");
  const displayName = pickFirst(projectLicense, ["displayName", "display_name"], spdxId);
  const family = pickFirst(projectLicense, ["family"], "-");
  const reviewLevel = pickFirst(projectLicense, ["reviewLevel", "review_level"], "-");
  const confidence = pickFirst(projectLicense, ["confidence"], null);
  const summary = pickFirst(projectLicense, ["summary"], "");
  const manualReviewRequired = Boolean(
    pickFirst(displayPolicy, ["requireManualReview", "require_manual_review"], false)
  );
  const warnings = safeArray(pickFirst(displayPolicy, ["warnings"], []));
  const permissions = safeArray(pickFirst(projectLicense, ["permissions"], []));
  const obligations = safeArray(pickFirst(projectLicense, ["obligations"], []));
  const notices = safeArray(pickFirst(projectLicense, ["notices"], []));
  const tone = licenseTone(spdxId, manualReviewRequired);

  return (
    <section className={`overflow-hidden rounded-[1.75rem] border ${tone.border} bg-[#080817]/75 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl`}>
      <div className={`h-1 bg-gradient-to-r ${tone.bg}`} />

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
                <Sparkles size={14} />
                License Intelligence
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                {normalized.analysisScope}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-black text-white md:text-3xl">
              대표 라이선스 분석
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              저장소 루트의 LICENSE, README, pom.xml, build.gradle 근거를 바탕으로 프로젝트 대표 라이선스를 판단합니다.
            </p>
          </div>

          <div className={`w-fit rounded-full border px-4 py-2 text-sm font-black ${tone.chip}`}>
            {manualReviewRequired ? "검토 필요" : "자동 판단 가능"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <div className={`relative overflow-hidden rounded-3xl border ${tone.border} bg-gradient-to-br ${tone.bg} p-6 xl:col-span-2`}>
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.05] p-3 text-white/70">
              <ShieldCheck size={22} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">
              Detected SPDX
            </p>
            <p className={`mt-4 break-all text-5xl font-black leading-none ${tone.text} md:text-6xl`}>
              {spdxId}
            </p>
            <p className="mt-4 text-lg font-semibold text-slate-100">{displayName}</p>
            {summary && <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">{summary}</p>}
          </div>

          <MetricCard
            icon={Gauge}
            label="Confidence"
            value={formatPercent(confidence)}
            hint="근거 파일과 매칭 강도 기준"
            tone="text-cyan-100"
          />

          <MetricCard
            icon={Scale}
            label="Review"
            value={formatReviewLevel(reviewLevel)}
            hint={`family: ${family}`}
            tone={manualReviewRequired ? "text-amber-100" : "text-emerald-100"}
          />
        </div>

        {(manualReviewRequired || warnings.length > 0 || normalized.reviewItems.length > 0) && (
          <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-200" />
              <div>
                <p className="font-bold text-amber-100">사람이 한 번 더 확인해야 하는 항목이 있습니다.</p>
                <div className="mt-2 space-y-1 text-sm leading-6 text-amber-50/80">
                  {warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                  {normalized.reviewItems.map((item, index) => (
                    <p key={`${pickFirst(item, ["type"], "review")}-${index}`}>
                      {pickFirst(item, ["message", "description", "title", "type"], "검토가 필요한 항목입니다.")}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <DetailList
            title="허용되는 대표 행위"
            items={permissions}
            emptyText="카탈로그에 등록된 허용 행위가 없습니다."
          />
          <DetailList
            title="지켜야 할 의무"
            items={obligations}
            emptyText="카탈로그에 등록된 의무가 없습니다."
          />
          <DetailList
            title="주의 안내"
            items={notices}
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
                  {normalized.evidences.length}개의 파일 근거가 연결되었습니다.
                </p>
              </div>
            </div>

            {artifactId && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                artifact #{artifactId}
              </span>
            )}
          </div>

          {normalized.evidences.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {normalized.evidences.map((evidence, index) => (
                <EvidenceCard
                  key={pickFirst(evidence, ["evidenceId", "id"], `evidence-${index}`)}
                  evidence={evidence}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm text-gray-500">
              <FileText size={18} className="mb-2 text-gray-400" />
              연결된 근거 파일이 없습니다. 이 경우 UNKNOWN 또는 검토 필요 결과일 수 있습니다.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <BadgeCheck size={14} className="text-cyan-300" />
          <span>schema {normalized.schemaVersion}</span>
          {normalized.generatedAt && <span>generated {new Date(normalized.generatedAt).toLocaleString()}</span>}
        </div>
      </div>
    </section>
  );
}
