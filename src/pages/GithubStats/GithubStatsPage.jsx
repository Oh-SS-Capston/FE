import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const CHART_WIDTH = 720;
const CHART_HEIGHT = 250;

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
function buildStarTrend(repository, summary) {
  const currentStars = Number(summary?.stars ?? 0);

  if (!currentStars) {
    return [];
  }

  const createdYear = repository?.createdAt
    ? new Date(repository.createdAt).getFullYear()
    : new Date().getFullYear() - 2;

  const nowYear = new Date().getFullYear();
  const startYear = Math.max(createdYear, nowYear - 3);
  const points = 28;

  return Array.from({ length: points }, (_, index) => {
    const ratio = points === 1 ? 1 : index / (points - 1);
    const curved = 0.22 + 0.78 * Math.pow(ratio, 0.82);
    const date = new Date(startYear, Math.floor(ratio * 12 * Math.max(1, nowYear - startYear + 1)), 1);

    return {
      label:
        index === 0
          ? String(startYear)
          : index === points - 1
          ? "현재"
          : date.getMonth() === 0
          ? String(date.getFullYear())
          : "",
      stars: Math.round(currentStars * curved),
    };
  });
}

function toPath(points, width, height, padding) {
  if (!points.length) return "";

  const values = points.map((point) => point.stars);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(...values, 0);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  return points
    .map((point, index) => {
      const x = padding.left + (innerWidth * index) / Math.max(1, points.length - 1);
      const y =
        padding.top +
        innerHeight -
        ((point.stars - minValue) / Math.max(1, maxValue - minValue)) * innerHeight;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function toAreaPath(points, width, height, padding) {
  const linePath = toPath(points, width, height, padding);

  if (!linePath) return "";

  const bottom = height - padding.bottom;
  return `${linePath} L ${width - padding.right} ${bottom} L ${padding.left} ${bottom} Z`;
}

function GlassPanel({ children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-[#070b1d]/70 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl ${className}`}
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
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-3">
        <Icon size={24} className={accentMap[accent] ?? accentMap.cyan} />
        <span className="text-sm font-bold text-gray-200">{label}</span>
      </div>

      <p className="mt-5 text-4xl font-black tracking-tight text-white">{value}</p>

      <p className={`mt-3 text-sm ${helper?.startsWith("↓") ? "text-slate-300" : "text-slate-300"}`}>
        {helper}
      </p>
    </article>
  );
}

function RepositoryHero({ repository, summary }) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="h-px bg-gradient-to-r from-cyan-400/70 via-blue-500/60 to-purple-500/70" />

      <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
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
              <h1 className="truncate text-2xl font-black text-white">
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
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(34,211,238,0.16)] transition hover:border-purple-300/40 hover:bg-purple-400/10"
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
  const data = useMemo(() => buildStarTrend(repository, summary), [repository, summary]);
  const padding = { top: 22, right: 26, bottom: 42, left: 54 };
  const linePath = toPath(data, CHART_WIDTH, CHART_HEIGHT, padding);
  const areaPath = toAreaPath(data, CHART_WIDTH, CHART_HEIGHT, padding);
  const maxValue = Math.max(1, ...data.map((item) => item.stars));
  const ticks = [0, Math.round(maxValue * 0.5), maxValue];

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Star size={23} className="text-yellow-300" />
          <h2 className="text-xl font-black text-white">스타 증가 추이</h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
          전체 기간
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-2">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-[280px] w-full"
          role="img"
          aria-label="스타 증가 추이 차트"
        >
          <defs>
            <linearGradient id="starLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>

            <linearGradient id="starArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(250,204,21,0.35)" />
              <stop offset="100%" stopColor="rgba(250,204,21,0.02)" />
            </linearGradient>
          </defs>

          {ticks.map((tick, index) => {
            const y =
              padding.top +
              (CHART_HEIGHT - padding.top - padding.bottom) *
                (1 - tick / Math.max(1, maxValue));

            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={CHART_WIDTH - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray={index === 0 ? "0" : "4 4"}
                />
                <text
                  x={12}
                  y={y + 4}
                  fill="rgba(226,232,240,0.72)"
                  fontSize="13"
                >
                  {compactNumber(tick)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#starArea)" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#starLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 8px rgba(250,204,21,0.55))"
          />

          {data.map((point, index) => {
            if (!point.label) return null;

            const x =
              padding.left +
              ((CHART_WIDTH - padding.left - padding.right) * index) /
                Math.max(1, data.length - 1);

            return (
              <text
                key={`${point.label}-${index}`}
                x={x}
                y={CHART_HEIGHT - 14}
                textAnchor="middle"
                fill="rgba(226,232,240,0.75)"
                fontSize="13"
              >
                {point.label}
              </text>
            );
          })}

          {data.length > 0 && (
            <g>
              <rect
                x={CHART_WIDTH - 84}
                y={36}
                width="62"
                height="32"
                rx="7"
                fill="rgba(15,23,42,0.75)"
                stroke="rgba(250,204,21,0.7)"
              />
              <text
                x={CHART_WIDTH - 53}
                y={57}
                textAnchor="middle"
                fill="#fef08a"
                fontSize="14"
                fontWeight="700"
              >
                {compactNumber(summary?.stars)}
              </text>
            </g>
          )}
        </svg>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        GitHub REST API는 과거 스타 누적값을 직접 제공하지 않으므로 현재 스타 수를 기준으로 화면용 추이를 표시합니다.
      </p>
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
          <h2 className="text-xl font-black text-white">최근 28일 이슈 흐름</h2>
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
          <p className="mt-1 text-2xl font-black text-white">{formatNumber(createdTotal)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.06] px-4 py-3">
          <p className="text-xs font-bold text-cyan-200">해결한 이슈</p>
          <p className="mt-1 text-2xl font-black text-white">{formatNumber(closedTotal)}</p>
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
        <h2 className="text-xl font-black text-white">한눈에 보기</h2>
      </div>

      <div className="divide-y divide-white/10">
        {(insights ?? []).map((item) => {
          const Icon = iconMap[item.type] ?? Sparkles;

          return (
            <article key={item.type} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <Icon size={22} className={toneMap[item.type] ?? "text-slate-300"} />
              <div>
                <p className={`font-black ${toneMap[item.type] ?? "text-slate-100"}`}>
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
      <h2 className="mb-5 text-xl font-black text-white">저장소 정보</h2>

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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const repoLabel = useMemo(
    () => stats?.repository?.fullName ?? repoParam ?? "GitHub 저장소",
    [repoParam, stats]
  );

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
            className="mt-5 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
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
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200 shadow-[0_0_22px_rgba(0,0,0,0.25)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
          >
            <ArrowLeft size={17} />
            분석 결과
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200 shadow-[0_0_22px_rgba(0,0,0,0.25)] transition hover:border-purple-300/30 hover:bg-purple-300/10 disabled:opacity-60"
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
            <p className="font-black text-red-200">GitHub 통계량 조회 실패</p>
            <p className="mt-2 text-sm text-red-200/80">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 rounded-full border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm text-red-100 hover:bg-red-300/20"
            >
              다시 시도
            </button>
          </GlassPanel>
        ) : (
          <div className="space-y-7">
            <RepositoryHero repository={repository} summary={summary} />

            <div>
              <h2 className="text-3xl font-black text-white">GitHub 통계</h2>
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
