import {
  CalendarClock,
  CheckCircle2,
  Database,
  GitBranch,
  GitCommitHorizontal,
  Github,
  Loader2,
  TriangleAlert,
} from "lucide-react";

function formatAnalyzedAt(value) {
  if (!value) {
    return "분석 시각 확인 중";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusMeta(status) {
  switch (String(status ?? "").toUpperCase()) {
    case "SUCCESS":
      return {
        label: "분석 완료",
        icon: CheckCircle2,
        className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
      };
    case "FAILED":
      return {
        label: "분석 실패",
        icon: TriangleAlert,
        className: "border-red-300/25 bg-red-300/10 text-red-100",
      };
    case "RUNNING":
      return {
        label: "분석 중",
        icon: Loader2,
        className: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
      };
    case "QUEUED":
      return {
        label: "분석 대기",
        icon: Loader2,
        className: "border-yellow-300/25 bg-yellow-300/10 text-yellow-100",
      };
    default:
      return null;
  }
}

function MetaItem({ icon: Icon, label, value, href, mono = false }) {
  const content = (
    <>
      <Icon size={15} className="shrink-0 text-cyan-200/80" />
      <span className="shrink-0 text-xs text-gray-400">{label}</span>
      <span
        className={`min-w-0 truncate text-sm font-semibold text-gray-100 ${
          mono ? "font-mono" : ""
        }`}
        title={value}
      >
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      {content}
    </div>
  );
}

export default function RepoInfoSection({
  repo,
  info,
  loading,
  error,
  commitSha,
  analysisRef,
  analyzedAt,
  analysisStatus,
  cacheHit = false,
}) {
  const commitUrl = info?.html_url && commitSha
    ? `${info.html_url}/commit/${encodeURIComponent(commitSha)}`
    : null;
  const status = statusMeta(analysisStatus);
  const StatusIcon = status?.icon;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl">
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
        }}
      />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <Github size={24} className="text-gray-300" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate bg-gradient-to-r from-cyan-200 to-purple-300 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                  {info?.full_name ?? repo}
                </h1>
                {loading ? (
                  <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-white/10" />
                ) : info?.description ? (
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-300 sm:text-base">
                    {info.description}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    레포지토리 설명이 등록되어 있지 않습니다.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-950/10 px-4 py-3 text-sm text-red-200">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>GitHub 메타데이터를 불러오지 못했습니다. {error}</span>
              </div>
            )}

            <div className="mt-5 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
              <MetaItem
                icon={GitCommitHorizontal}
                label="Commit"
                value={commitSha ? commitSha.slice(0, 12) : "확인 중"}
                href={commitUrl}
                mono
              />
              <MetaItem
                icon={GitBranch}
                label="Ref"
                value={analysisRef ?? "확인 중"}
                mono
              />
              <MetaItem
                icon={CalendarClock}
                label="분석 시각"
                value={formatAnalyzedAt(analyzedAt)}
              />
              <MetaItem
                icon={Database}
                label="결과 유형"
                value={cacheHit ? "기존 분석 결과" : "신규 분석 결과"}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {status && (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${status.className}`}
                >
                  <StatusIcon
                    size={15}
                    className={analysisStatus === "RUNNING" || analysisStatus === "QUEUED" ? "animate-spin" : ""}
                  />
                  {status.label}
                </span>
              )}

              {info?.language && (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-gray-300">
                  {info.language}
                </span>
              )}
              {info?.license?.spdx_id && (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-gray-300">
                  {info.license.spdx_id}
                </span>
              )}
              {typeof info?.stargazers_count === "number" && (
                <span className="text-gray-400">
                  <strong className="text-cyan-200">
                    {info.stargazers_count.toLocaleString()}
                  </strong>{" "}
                  stars
                </span>
              )}
              {typeof info?.forks_count === "number" && (
                <span className="text-gray-400">
                  <strong className="text-purple-200">
                    {info.forks_count.toLocaleString()}
                  </strong>{" "}
                  forks
                </span>
              )}
            </div>
          </div>

          {info?.html_url && (
            <a
              href={info.html_url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-xl border border-purple-300/20 bg-purple-300/10 px-4 py-2.5 text-sm font-semibold text-purple-100 transition hover:border-purple-300/40 hover:bg-purple-300/20"
            >
              GitHub에서 보기 →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
