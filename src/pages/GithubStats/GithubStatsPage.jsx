import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Code2,
  ExternalLink,
  GitBranch,
  GitFork,
  Github,
  History,
  Languages,
  Loader2,
  RefreshCw,
  Scale,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { getGithubStats } from "../../features/githubStats/api/githubStatsApi";
import { formatUserErrorMessage } from "../../shared/lib/userErrorMessage";

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("ko-KR");
}

function compactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  const number = Number(value);

  if (Math.abs(number) >= 1000) {
    return `${(number / 1000).toFixed(number >= 10000 ? 1 : 1)}k`;
  }

  return number.toLocaleString("ko-KR");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5);
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatRelease(repository) {
  if (!repository?.latestRelease) {
    return "-";
  }

  const publishedAt = formatDate(repository.latestReleasePublishedAt);
  return publishedAt === "-"
    ? repository.latestRelease
    : `${repository.latestRelease} (${publishedAt})`;
}

function formatDelta(value, unit = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "현재 GitHub 기준";
  }

  const number = Number(value);
  const sign = number > 0 ? "↑" : number < 0 ? "↓" : "→";
  const abs = Math.abs(number).toLocaleString("ko-KR");

  return `${sign} ${abs}${unit} (지난 수집 대비)`;
}
function GlassPanel({ children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, helper, accent = "cyan" }) {
  const accentMap = {
    yellow: "text-yellow-300",
    purple: "text-purple-300",
    cyan: "text-cyan-300",
    blue: "text-blue-300",
  };

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
      <div className="flex items-center gap-3">
        <Icon size={24} className={accentMap[accent] ?? accentMap.cyan} />
        <span className="text-sm font-bold text-gray-200">{label}</span>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">{value}</p>

      <p className={`mt-3 text-sm ${helper?.startsWith("↓") ? "text-slate-300" : "text-slate-300"}`}>
        {helper}
      </p>
    </article>
  );
}

function RepositoryHero({ repository, summary }) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
            {repository?.avatarUrl ? (
              <img
                src={repository.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Github size={34} className="text-slate-300" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-semibold text-white">
                {repository?.fullName ?? "GitHub 저장소"}
              </h1>

              {repository?.htmlUrl && (
                <a
                  href={repository.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-slate-400 transition hover:text-cyan-200"
                  aria-label="GitHub 저장소 열기"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>

            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              {repository?.description || "저장소 설명이 없습니다."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {repository?.language && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {repository.language}
                </span>
              )}

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-slate-300">
                <Star size={15} className="text-yellow-300" />
                {compactNumber(summary?.stars)}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-slate-300">
                <GitFork size={15} />
                {compactNumber(summary?.forks)}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-slate-300">
                <CalendarDays size={15} />
                최종 업데이트: {formatDate(repository?.pushedAt ?? repository?.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {repository?.htmlUrl && (
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--surface-hover)]"
          >
            GitHub에서 보기
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </GlassPanel>
  );
}

function StarTrendChart({ repository, summary }) {
  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Star size={23} className="text-yellow-300" />
          <h2 className="text-xl font-semibold text-white">스타 추이</h2>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
        <p className="text-sm leading-6 text-slate-300">
          GitHub REST API 응답에는 과거 스타 누적 데이터가 포함되지 않습니다. 현재 스타 수를 기반으로 추정 곡선을 만들지 않고, 실제로 제공되는 현재 수치만 표시합니다.
        </p>
        <p className="mt-4 text-3xl font-semibold text-white">
          {compactNumber(summary?.stars)}
        </p>
      </div>
    </GlassPanel>
  );
}

function IssueActivityChart({ activity }) {
  const data =
    activity?.recent28dDailyIssueActivities ??
    activity?.recent28dDailyActivities ??
    [];

  const createdTotal = data.reduce(
    (sum, item) => sum + Number(item.issuesCreated ?? 0),
    0
  );
  const closedTotal = data.reduce(
    (sum, item) => sum + Number(item.issuesClosed ?? 0),
    0
  );

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      Number(item.issuesCreated ?? 0),
      Number(item.issuesClosed ?? 0),
    ])
  );

  const width = 620;
  const height = 250;
  const padding = { top: 24, right: 22, bottom: 38, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const groupWidth = innerWidth / Math.max(1, data.length);
  const barWidth = Math.max(4, Math.min(11, groupWidth * 0.32));

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Zap size={22} className="text-cyan-300" />
          <h2 className="text-xl font-semibold text-white">최근 28일 이슈 흐름</h2>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-purple-500" />
            이슈 생성
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-cyan-400" />
            이슈 해결
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-purple-300/15 bg-purple-400/[0.06] px-4 py-3">
          <p className="text-xs font-bold text-purple-200">생성된 이슈</p>
          <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(createdTotal)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.06] px-4 py-3">
          <p className="text-xs font-bold text-cyan-200">해결한 이슈</p>
          <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(closedTotal)}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-slate-500">
          표시할 이슈 활동 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[280px] w-full"
            role="img"
            aria-label="최근 28일 이슈 생성 및 해결 차트"
          >
            {[0, 0.5, 1].map((ratio) => {
              const y = padding.top + innerHeight * (1 - ratio);

              return (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray={ratio === 0 ? "0" : "4 4"}
                />
              );
            })}

            {data.map((item, index) => {
              const issuesCreated = Number(item.issuesCreated ?? 0);
              const issuesClosed = Number(item.issuesClosed ?? 0);
              const x = padding.left + index * groupWidth + groupWidth / 2;
              const createdHeight = (issuesCreated / maxValue) * innerHeight;
              const closedHeight = (issuesClosed / maxValue) * innerHeight;

              return (
                <g key={`${item.date}-${index}`}>
                  <rect
                    x={x - barWidth - 2}
                    y={padding.top + innerHeight - createdHeight}
                    width={barWidth}
                    height={createdHeight}
                    rx="4"
                    fill="#8b5cf6"
                    opacity="0.9"
                  />
                  <rect
                    x={x + 2}
                    y={padding.top + innerHeight - closedHeight}
                    width={barWidth}
                    height={closedHeight}
                    rx="4"
                    fill="#22d3ee"
                    opacity="0.9"
                  />

                  {index === 0 ||
                  index === data.length - 1 ||
                  index === Math.floor(data.length / 3) ||
                  index === Math.floor((data.length * 2) / 3) ? (
                    <text
                      x={x}
                      y={height - 12}
                      textAnchor="middle"
                      fill="rgba(226,232,240,0.72)"
                      fontSize="12"
                    >
                      {formatShortDate(item.date)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </GlassPanel>
  );
}

function InsightSummary({ insights }) {
  const iconMap = {
    POPULARITY: Star,
    MAINTENANCE: Code2,
    COMMUNITY: Users,
  };

  const toneMap = {
    POPULARITY: "text-yellow-300",
    MAINTENANCE: "text-cyan-300",
    COMMUNITY: "text-purple-300",
  };

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <Sparkles size={22} className="text-purple-300" />
        <h2 className="text-xl font-semibold text-white">한눈에 보기</h2>
      </div>

      <div className="divide-y divide-white/10">
        {(insights ?? []).map((item) => {
          const Icon = iconMap[item.type] ?? Sparkles;

          return (
            <article key={item.type} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <Icon size={22} className={toneMap[item.type] ?? "text-slate-300"} />
              <div>
                <p className={`font-semibold ${toneMap[item.type] ?? "text-slate-100"}`}>
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.message}</p>
              </div>
            </article>
          );
        })}
      </div>
    </GlassPanel>
  );
}

function RepositoryInfoPanel({ repository }) {
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
          ? `${repository?.language} (${repository.languagePercent}%)`
          : repository?.language,
    },
    {
      icon: CalendarDays,
      label: "최초 커밋",
      value: formatDate(repository?.createdAt),
    },
    {
      icon: History,
      label: "최근 릴리즈",
      value: formatRelease(repository),
    },
  ];

  return (
    <GlassPanel className="p-6">
      <h2 className="mb-5 text-xl font-semibold text-white">저장소 정보</h2>

      <div className="divide-y divide-white/10">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 text-slate-400">
              <Icon size={18} className="text-slate-500" />
              <span className="text-sm">{label}</span>
            </div>

            <span className="min-w-0 truncate text-right text-sm font-semibold text-slate-200">
              {value || "-"}
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export default function GithubStatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const runId = location.state?.runId ?? searchParams.get("runId");
  const repoParam = location.state?.repo ?? searchParams.get("repo");

  const [stats, setStats] = useState(null);
  const statsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const repoLabel = useMemo(
    () => stats?.repository?.fullName ?? repoParam ?? "GitHub 저장소",
    [repoParam, stats]
  );

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);
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

      } catch (e) {
        if (forceRefresh) {
          try {
            const cachedData = await getGithubStats(runId, {
              forceRefresh: false,
            });

            setStats(cachedData);
            setError(
              "최신 GitHub 데이터를 갱신하지 못해 기존 통계를 표시하고 있습니다. 잠시 후 다시 시도해주세요."
            );
            return;
          } catch {
            if (statsRef.current) {
              setError(
                "최신 GitHub 데이터를 갱신하지 못해 기존 통계를 표시하고 있습니다. 잠시 후 다시 시도해주세요."
              );
              return;
            }
          }
        }

        setError(formatUserErrorMessage(e, "GitHub 통계량을 불러오지 못했습니다."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [runId]
  );

  useEffect(() => {
    setStats(null);
    setError(null);

    if (runId) {
      loadStats({ forceRefresh: false });
    }
  }, [runId, loadStats]);

  const handleRefresh = () => {
    loadStats({ forceRefresh: true, silent: true });
  };

  if (!runId) {
    return (
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
        <GlassPanel className="p-8 text-center">
          <p className="text-slate-300">runId가 없어 GitHub 통계를 조회할 수 없습니다.</p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-lg bg-[var(--surface-secondary)] px-4 py-2 text-sm text-white hover:bg-[var(--surface-hover)]"
          >
            홈으로 돌아가기
          </button>
        </GlassPanel>
      </div>
    );
  }

  const repository = stats?.repository;
  const summary = stats?.summary;
  const activity = stats?.activity;

  return (
    <div className="relative z-10">
      <div className="mx-auto w-[90vw] max-w-[1500px] px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-[var(--surface-hover)]"
          >
            <ArrowLeft size={17} />
            분석 결과
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-[var(--surface-hover)] disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>

        {loading && !stats ? (
          <GlassPanel className="p-10">
            <div className="flex items-center gap-3 text-slate-300">
              <Loader2 size={22} className="animate-spin text-cyan-300" />
              <span>GitHub 통계량을 불러오는 중입니다.</span>
            </div>
          </GlassPanel>
        ) : error && !stats ? (
          <GlassPanel className="border-red-400/20 bg-red-950/20 p-8">
            <p className="font-semibold text-red-200">GitHub 통계량 조회 실패</p>
            <p className="mt-2 text-sm text-red-200/80">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 rounded-lg border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm text-red-100 hover:bg-red-300/20"
            >
              다시 시도
            </button>
          </GlassPanel>
        ) : (
          <div className="space-y-7">
            <RepositoryHero repository={repository} summary={summary} />

            <div>
              <h2 className="text-3xl font-semibold text-white">GitHub 통계</h2>
              <p className="mt-2 text-base text-slate-400">
                저장소의 인기와 활동성을 한눈에 확인하고, 코드 구조 분석과 함께 프로젝트를 판단하세요.
              </p>
              <p className="mt-1 text-xs text-slate-600">{repoLabel}</p>
            </div>

            {error && (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
                {error}
              </div>
            )}

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                icon={Star}
                label="스타 수"
                value={compactNumber(summary?.stars)}
                helper={formatDelta(summary?.starDelta28d)}
                accent="yellow"
              />

              <MetricCard
                icon={GitFork}
                label="포크 수"
                value={compactNumber(summary?.forks)}
                helper={formatDelta(summary?.forkDelta28d)}
                accent="purple"
              />

              <MetricCard
                icon={AlertCircle}
                label="오픈 이슈"
                value={formatNumber(summary?.openIssues)}
                helper={formatDelta(summary?.openIssueDelta28d)}
                accent="yellow"
              />

              <MetricCard
                icon={BarChart3}
                label="최근 28일 해결 이슈"
                value={
                  summary?.recent28dClosedIssues === null ||
                  summary?.recent28dClosedIssues === undefined
                    ? "수집 실패"
                    : formatNumber(summary.recent28dClosedIssues)
                }
                helper={
                  summary?.recent28dClosedIssues === null ||
                  summary?.recent28dClosedIssues === undefined
                    ? "GitHub 이슈 API 확인 필요"
                    : "최근 28일 closed 기준"
                }
                accent="cyan"
              />

              <MetricCard
                icon={Users}
                label="기여자 수"
                value={formatNumber(summary?.contributors)}
                helper={formatDelta(summary?.contributorDelta28d)}
                accent="blue"
              />
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <StarTrendChart repository={repository} summary={summary} />
              <IssueActivityChart activity={activity} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <InsightSummary insights={stats?.insights} />
              <RepositoryInfoPanel repository={repository} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
