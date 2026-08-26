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

function formatChartDateLabel(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return formatShortDate(value);
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeStarTrendData(stats) {
  const candidates = [
    stats?.starTrend,
    stats?.starHistory,
    stats?.starsHistory,
    stats?.stargazerHistory,
    stats?.activity?.starTrend,
    stats?.activity?.starHistory,
    stats?.activity?.starsHistory,
    stats?.activity?.dailyStarCounts,
    stats?.activity?.recent28dDailyStarCounts,
    stats?.activity?.recent28dDailyStarHistory,
    stats?.summary?.starTrend,
    stats?.summary?.starHistory,
  ];

  const source = candidates
    .map((candidate) => {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      return candidate?.points ?? candidate?.items ?? candidate?.data ?? candidate?.values;
    })
    .find((candidate) => Array.isArray(candidate));

  if (!source) {
    return [];
  }

  return source
    .map((item, index) => {
      const date =
        item?.date ??
        item?.day ??
        item?.collectedAt ??
        item?.capturedAt ??
        item?.timestamp ??
        item?.createdAt ??
        item?.label;
      const stars = toFiniteNumber(
        item?.stars ??
          item?.starCount ??
          item?.stargazers ??
          item?.stargazersCount ??
          item?.stargazers_count ??
          item?.count ??
          item?.value
      );

      if (!date || stars === null) {
        return null;
      }

      return {
        date,
        stars,
        key: `${date}-${index}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();

      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return 0;
      }

      return aTime - bTime;
    });
}

function buildStarTrendData(stats, summary) {
  const historicalData = normalizeStarTrendData(stats);

  if (historicalData.length > 0) {
    return {
      data: historicalData,
      sourceLabel: "수집된 스타 히스토리",
    };
  }

  const currentStars = toFiniteNumber(summary?.stars);

  if (currentStars === null) {
    return {
      data: [],
      sourceLabel: "스타 데이터 없음",
    };
  }

  const starDelta = toFiniteNumber(summary?.starDelta28d);

  if (starDelta !== null) {
    return {
      data: [
        {
          date: "이전 수집",
          stars: Math.max(0, currentStars - starDelta),
          key: "previous-stars",
        },
        {
          date: "현재",
          stars: currentStars,
          key: "current-stars",
        },
      ],
      sourceLabel: "현재 스타 수와 지난 수집 대비 변화량",
    };
  }

  return {
    data: [
      {
        date: "현재",
        stars: currentStars,
        key: "current-stars",
      },
    ],
    sourceLabel: "현재 스타 수",
  };
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

function formatPeriodDelta(value, unit = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }

  const number = Number(value);
  const sign = number > 0 ? "↑" : number < 0 ? "↓" : "→";
  const abs = Math.abs(number).toLocaleString("ko-KR");

  return `${sign} ${abs}${unit} (기간 내 변화)`;
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

function MetricItem({ icon: Icon, label, value, helper, accent = "text-slate-400" }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
        <Icon size={16} className={accent} />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500" title={helper}>
        {helper}
      </p>
    </div>
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

function StarTrendChart({ stats, summary }) {
  const { data, sourceLabel } = buildStarTrendData(stats, summary);
  const firstStars = data[0]?.stars ?? null;
  const lastStars = data[data.length - 1]?.stars ?? null;
  const change = firstStars !== null && lastStars !== null ? lastStars - firstStars : null;

  const width = 680;
  const height = 270;
  const padding = { top: 28, right: 28, bottom: 42, left: 58 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const rawMinStars = data.length > 0 ? Math.min(...data.map((item) => item.stars)) : 0;
  const rawMaxStars = data.length > 0 ? Math.max(...data.map((item) => item.stars)) : 1;
  const minStars = rawMinStars === rawMaxStars ? Math.max(0, rawMinStars - 1) : rawMinStars;
  const maxStars = rawMinStars === rawMaxStars ? rawMaxStars + 1 : rawMaxStars;
  const valueRange = Math.max(1, maxStars - minStars);
  const points = data.map((item, index) => {
    const x =
      padding.left +
      (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((item.stars - minStars) / valueRange) * innerHeight;

    return { ...item, x, y };
  });
  const linePath =
    points.length === 1
      ? `M ${padding.left} ${points[0].y} L ${width - padding.right} ${points[0].y}`
      : points
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ");
  const areaPath =
    points.length > 0
      ? points.length === 1
        ? `M ${padding.left} ${points[0].y} L ${width - padding.right} ${points[0].y} L ${
            width - padding.right
          } ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`
        : `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${
            points[0].x
          } ${padding.top + innerHeight} Z`
      : "";
  const yTicks = [0, 0.5, 1].map((ratio) => ({
    ratio,
    value: Math.round(minStars + valueRange * ratio),
    y: padding.top + innerHeight * (1 - ratio),
  }));
  const xLabelIndexes = Array.from(
    new Set([
      0,
      Math.floor((data.length - 1) / 2),
      data.length - 1,
    ])
  ).filter((index) => index >= 0 && index < data.length);

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Star size={23} className="text-yellow-300" />
          <h2 className="text-xl font-semibold text-white">스타 추이</h2>
        </div>

        {data.length > 0 && (
          <div className="text-right text-sm text-slate-300">
            <span className="font-semibold text-white">{compactNumber(lastStars)}</span>
            <span className="ml-2 text-slate-500">
              {formatPeriodDelta(change)}
            </span>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
        <span>
          현재 스타 <span className="font-semibold text-slate-100">{compactNumber(summary?.stars)}</span>
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:inline-block" />
        <span>
          차트 기준 <span className="font-medium text-slate-300">{sourceLabel}</span>
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-slate-500">
          표시할 스타 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[300px] w-full"
            role="img"
            aria-label="스타 누적 추이 차트"
          >
            <defs>
              <linearGradient id="starTrendLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <linearGradient id="starTrendArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => (
              <g key={tick.ratio}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={width - padding.right}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray={tick.ratio === 0 ? "0" : "4 4"}
                />
                <text
                  x={padding.left - 12}
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="rgba(226,232,240,0.68)"
                  fontSize="12"
                >
                  {compactNumber(tick.value)}
                </text>
              </g>
            ))}

            <path d={areaPath} fill="url(#starTrendArea)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#starTrendLine)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <circle
                key={point.key}
                cx={point.x}
                cy={point.y}
                r={index === points.length - 1 ? 5 : 3.5}
                fill={index === points.length - 1 ? "#facc15" : "#22d3ee"}
                stroke="#0D0F16"
                strokeWidth="2"
              >
                <title>{`${formatDate(point.date)}: ${formatNumber(point.stars)} stars`}</title>
              </circle>
            ))}

            {xLabelIndexes.map((index) => {
              const point = points[index];

              return (
                <text
                  key={`${point.key}-label`}
                  x={point.x}
                  y={height - 14}
                  textAnchor="middle"
                  fill="rgba(226,232,240,0.72)"
                  fontSize="12"
                >
                  {formatChartDateLabel(point.date)}
                </text>
              );
            })}
          </svg>
        </div>
      )}
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
  const hasIssueActivity = createdTotal + closedTotal > 0;

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

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
        <span>
          생성된 이슈 <span className="font-semibold text-purple-200">{formatNumber(createdTotal)}</span>
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:inline-block" />
        <span>
          해결한 이슈 <span className="font-semibold text-cyan-200">{formatNumber(closedTotal)}</span>
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-slate-500">
          최근 28일 간 이슈가 없습니다.
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-2">
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

          {!hasIssueActivity && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-sm font-semibold text-slate-300">
                최근 28일 간 이슈가 없습니다.
              </div>
            </div>
          )}
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

            <section className="grid gap-x-8 gap-y-5 border-y border-[var(--border)] py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricItem
                icon={Star}
                label="스타 수"
                value={compactNumber(summary?.stars)}
                helper={formatDelta(summary?.starDelta28d)}
                accent="text-yellow-300"
              />

              <MetricItem
                icon={GitFork}
                label="포크 수"
                value={compactNumber(summary?.forks)}
                helper={formatDelta(summary?.forkDelta28d)}
                accent="text-purple-300"
              />

              <MetricItem
                icon={AlertCircle}
                label="오픈 이슈"
                value={formatNumber(summary?.openIssues)}
                helper={formatDelta(summary?.openIssueDelta28d)}
                accent="text-yellow-300"
              />

              <MetricItem
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
                accent="text-cyan-300"
              />

              <MetricItem
                icon={Users}
                label="기여자 수"
                value={formatNumber(summary?.contributors)}
                helper={formatDelta(summary?.contributorDelta28d)}
                accent="text-blue-300"
              />
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <StarTrendChart stats={stats} summary={summary} />
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
