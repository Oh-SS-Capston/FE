import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Code2,
  ExternalLink,
  GitBranch,
  Github,
  GitFork,
  History,
  Info,
  Languages,
  Loader2,
  RefreshCw,
  Scale,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { getGithubStats } from "../../features/githubStats/api/githubStatsApi";

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return Number(value).toLocaleString("ko-KR");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function statusText(stats) {
  if (!stats) return "";

  if (stats.fromCache) {
    return `캐시 데이터 · 수집 시각 ${formatDateTime(stats.collectedAt)}`;
  }

  return `최신 조회 데이터 · 수집 시각 ${formatDateTime(stats.collectedAt)}`;
}

function StatCard({ icon: Icon, label, value, helper, accent = "cyan" }) {
  const accentClass =
    accent === "purple"
      ? "from-purple-400 to-fuchsia-400"
      : accent === "emerald"
      ? "from-emerald-300 to-cyan-300"
      : accent === "yellow"
      ? "from-yellow-300 to-orange-300"
      : "from-cyan-300 to-blue-400";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p
            className={`mt-3 bg-gradient-to-r ${accentClass} bg-clip-text text-3xl font-black text-transparent`}
          >
            {value}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <Icon size={22} className="text-gray-300" />
        </div>
      </div>

      {helper && <p className="mt-4 text-xs leading-5 text-gray-500">{helper}</p>}
    </article>
  );
}

function RepositoryHeader({ repository, summary, status, onRefresh, refreshing }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a1a]/70 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-cyan-300/60 via-blue-500/60 to-purple-500/60" />

      <div className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Github size={14} />
              GitHub Repository Insight
            </div>

            <h1 className="truncate text-4xl font-black tracking-tight text-white">
              {repository?.fullName ?? "GitHub 저장소"}
            </h1>

            <p className="mt-3 max-w-4xl text-base leading-7 text-gray-400">
              {repository?.description || "저장소 설명이 없습니다."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              {repository?.language && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-gray-300">
                  {repository.language}
                  {repository.languagePercent !== null &&
                    repository.languagePercent !== undefined &&
                    ` ${repository.languagePercent}%`}
                </span>
              )}

              <span className="text-gray-500">
                <span className="font-semibold text-cyan-300">
                  {formatNumber(summary?.stars)}
                </span>{" "}
                stars
              </span>

              <span className="text-gray-500">
                <span className="font-semibold text-purple-300">
                  {formatNumber(summary?.forks)}
                </span>{" "}
                forks
              </span>

              {repository?.license && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-gray-300">
                  {repository.license}
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-600">{status}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              새로고침
            </button>

            {repository?.htmlUrl && (
              <a
                href={repository.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_25px_rgba(34,211,238,0.25)] transition hover:opacity-90"
              >
                GitHub에서 보기
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentActivityChart({ activity, recent28dCommits }) {
  const processing = activity?.commitStatsProcessing;
  const data = activity?.recent28dDailyActivities ?? [];

  const numericData = data.map((item) => ({
    date: item.date,
    commits: typeof item.commits === "number" ? item.commits : null,
  }));

  const hasKnownCommit = numericData.some((item) => item.commits !== null);
  const maxCommit = Math.max(
    1,
    ...numericData.map((item) => (item.commits === null ? 0 : item.commits))
  );

  const width = 560;
  const height = 220;
  const paddingX = 24;
  const paddingTop = 24;
  const paddingBottom = 38;
  const chartHeight = height - paddingTop - paddingBottom;
  const barGap = 4;
  const barWidth =
    numericData.length > 0
      ? (width - paddingX * 2) / numericData.length - barGap
      : 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a0a1a]/70 p-6 backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">최근 28일 커밋 활동</h2>
          <p className="mt-2 text-sm text-gray-500">
            GitHub commit activity 통계를 기반으로 일별 커밋 수를 표시합니다.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            28D Commits
          </p>
          <p className="mt-1 text-xl font-black text-cyan-200">
            {recent28dCommits === null || recent28dCommits === undefined
              ? "수집 중"
              : formatNumber(recent28dCommits)}
          </p>
        </div>
      </div>

      {processing && !hasKnownCommit ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.03] text-center">
          <Loader2 size={28} className="mb-4 animate-spin text-cyan-300" />
          <p className="font-semibold text-cyan-100">
            GitHub 커밋 통계를 수집 중입니다.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
            GitHub 통계 API가 아직 커밋 활동 데이터를 생성 중입니다. 화면이 열려
            있으면 잠시 후 자동으로 다시 확인합니다.
          </p>
        </div>
      ) : numericData.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-gray-500">
          표시할 커밋 활동 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[280px] w-full"
            role="img"
            aria-label="최근 28일 커밋 활동 차트"
          >
            <line
              x1={paddingX}
              y1={height - paddingBottom}
              x2={width - paddingX}
              y2={height - paddingBottom}
              stroke="rgba(255,255,255,0.12)"
            />

            {numericData.map((item, index) => {
              const value = item.commits ?? 0;
              const barHeight = (value / maxCommit) * chartHeight;
              const x = paddingX + index * (barWidth + barGap);
              const y = height - paddingBottom - barHeight;

              return (
                <g key={`${item.date}-${index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(2, barWidth)}
                    height={barHeight}
                    rx="4"
                    fill="url(#commitGradient)"
                    opacity={item.commits === null ? 0.25 : 0.9}
                  />

                  {index === 0 ||
                  index === numericData.length - 1 ||
                  index === Math.floor(numericData.length / 2) ? (
                    <text
                      x={x + barWidth / 2}
                      y={height - 12}
                      textAnchor="middle"
                      fill="rgba(209,213,219,0.65)"
                      fontSize="11"
                    >
                      {item.date?.slice(5)}
                    </text>
                  ) : null}
                </g>
              );
            })}

            <defs>
              <linearGradient id="commitGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {recent28dCommits === 0 && (
            <p className="mt-2 text-center text-sm text-gray-500">
              최근 28일 동안 확인된 커밋이 없습니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function InsightSummary({ insights }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a0a1a]/70 p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl border border-purple-300/20 bg-purple-300/10 p-3">
          <Sparkles size={20} className="text-purple-200" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">한눈에 보기</h2>
          <p className="mt-1 text-sm text-gray-500">
            GitHub 통계량을 기반으로 저장소 상태를 요약합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {(insights ?? []).map((item) => (
          <article
            key={item.type}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="font-bold text-gray-100">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {item.message}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RepositoryInfoPanel({ repository, summary }) {
  const rows = [
    {
      icon: GitBranch,
      label: "기본 브랜치",
      value: repository?.defaultBranch,
    },
    {
      icon: Scale,
      label: "라이선스",
      value: repository?.license,
    },
    {
      icon: Languages,
      label: "주요 언어",
      value:
        repository?.languagePercent !== null &&
        repository?.languagePercent !== undefined
          ? `${repository?.language} ${repository.languagePercent}%`
          : repository?.language,
    },
    {
      icon: CalendarDays,
      label: "생성일",
      value: formatDate(repository?.createdAt),
    },
    {
      icon: History,
      label: "최근 Push",
      value: formatDate(repository?.pushedAt),
    },
    {
      icon: Code2,
      label: "최신 릴리즈",
      value: repository?.latestRelease
        ? `${repository.latestRelease} · ${formatDate(
            repository.latestReleasePublishedAt
          )}`
        : "-",
    },
    {
      icon: AlertCircle,
      label: "최근 28일 이슈 생성",
      value: formatNumber(summary?.recent28dIssues),
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a0a1a]/70 p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
          <Info size={20} className="text-cyan-200" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">저장소 정보</h2>
          <p className="mt-1 text-sm text-gray-500">
            GitHub 저장소의 기본 메타 정보를 표시합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3 text-gray-400">
              <Icon size={17} className="shrink-0 text-gray-500" />
              <span className="shrink-0 text-sm">{label}</span>
            </div>

            <span className="min-w-0 truncate text-right text-sm font-medium text-gray-200">
              {value || "-"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GithubStatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const runId = location.state?.runId ?? searchParams.get("runId");
  const repoParam = location.state?.repo ?? searchParams.get("repo");

  const pollCountRef = useRef(0);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const repoLabel = useMemo(() => {
    return stats?.repository?.fullName ?? repoParam ?? "GitHub 저장소";
  }, [repoParam, stats]);

  const loadStats = useCallback(
    async ({ forceRefresh = false, silent = false } = {}) => {
      if (!runId) return;

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data = await getGithubStats(runId, { forceRefresh });

        setStats(data);

        if (!data?.activity?.commitStatsProcessing) {
          pollCountRef.current = 0;
        }
      } catch (e) {
        setError(e?.message ?? "GitHub 통계량을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [runId]
  );

  useEffect(() => {
    pollCountRef.current = 0;
    setStats(null);
    setError(null);

    if (runId) {
      loadStats({ forceRefresh: false });
    }
  }, [runId, loadStats]);

  /*
   * commitStatsProcessing=true이면 사용자가 직접 재요청하지 않아도
   * 화면이 열려 있는 동안 백엔드에 자동으로 다시 확인합니다.
   */
  useEffect(() => {
    if (!stats?.activity?.commitStatsProcessing) {
      return;
    }

    if (pollCountRef.current >= 10) {
      return;
    }

    const timerId = window.setTimeout(() => {
      pollCountRef.current += 1;
      loadStats({ forceRefresh: true, silent: true });
    }, 30000);

    return () => window.clearTimeout(timerId);
  }, [stats?.activity?.commitStatsProcessing, stats?.collectedAt, loadStats]);

  const handleRefresh = () => {
    pollCountRef.current = 0;
    loadStats({ forceRefresh: true, silent: true });
  };

  if (!runId) {
    return (
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-[#0a0a1a]/70 p-8 text-center backdrop-blur-xl">
          <p className="text-gray-300">runId가 없어 GitHub 통계를 조회할 수 없습니다.</p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const repository = stats?.repository;
  const summary = stats?.summary;
  const activity = stats?.activity;

  return (
    <div className="relative z-10">
      <div className="mx-auto w-[90vw] px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={18} />
            이전 화면
          </button>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
              Repository Stats
            </p>
            <p className="mt-1 text-sm text-gray-500">{repoLabel}</p>
          </div>
        </div>

        {loading && !stats ? (
          <section className="rounded-3xl border border-white/10 bg-[#0a0a1a]/70 p-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 size={20} className="animate-spin text-cyan-300" />
              <span>GitHub 통계량을 불러오는 중입니다.</span>
            </div>
          </section>
        ) : error && !stats ? (
          <section className="rounded-3xl border border-red-500/20 bg-red-950/20 p-8 backdrop-blur-xl">
            <p className="font-bold text-red-200">GitHub 통계량 조회 실패</p>
            <p className="mt-2 text-sm text-red-200/80">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 rounded-full border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm text-red-100 hover:bg-red-300/20"
            >
              다시 시도
            </button>
          </section>
        ) : (
          <div className="space-y-8">
            <RepositoryHeader
              repository={repository}
              summary={summary}
              status={statusText(stats)}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />

            {error && (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
                {error}
              </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                icon={Star}
                label="Stars"
                value={formatNumber(summary?.stars)}
                helper="저장소 관심도"
                accent="yellow"
              />

              <StatCard
                icon={GitFork}
                label="Forks"
                value={formatNumber(summary?.forks)}
                helper="파생 개발 규모"
                accent="purple"
              />

              <StatCard
                icon={AlertCircle}
                label="Open Issues"
                value={formatNumber(summary?.openIssues)}
                helper="현재 열려 있는 이슈"
              />

              <StatCard
                icon={BarChart3}
                label="28D Commits"
                value={
                  summary?.recent28dCommits === null ||
                  summary?.recent28dCommits === undefined
                    ? "수집 중"
                    : formatNumber(summary.recent28dCommits)
                }
                helper={
                  activity?.commitStatsProcessing
                    ? "GitHub 통계 생성 중"
                    : "최근 28일 커밋"
                }
                accent="emerald"
              />

              <StatCard
                icon={Users}
                label="Contributors"
                value={formatNumber(summary?.contributors)}
                helper="기여자 규모"
                accent="purple"
              />
            </section>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
              <RecentActivityChart
                activity={activity}
                recent28dCommits={summary?.recent28dCommits}
              />

              <div className="space-y-8">
                <InsightSummary insights={stats?.insights} />
                <RepositoryInfoPanel repository={repository} summary={summary} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}