import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

import SearchBar from "./components/SearchBar";
import SearchHistory from "./components/SearchHistory";
import { useAuth } from "../../features/auth/model/AuthContext";
import { createRepoRun, getRecentRuns } from "../../features/run/api/runApi";
import InsufficientTokenModal from "../../features/token/components/InsufficientTokenModal";
import { TOKEN_COST } from "../../features/token/constants/tokenPolicy";
import { formatUserErrorMessage } from "../../shared/lib/userErrorMessage";
import AnalysisRequestConfirmModal from "../../features/token/components/AnalysisRequestConfirmModal";
import { getMyTokenBalance } from "../../features/token/api/tokenApi";
import Badge from "../../shared/components/ui/Badge";

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

function findScrollParent(node) {
  let parent = node?.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;

    if (
      /(auto|scroll|overlay)/.test(overflowY) &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return window;
}

function getRootRect(scrollRoot) {
  if (scrollRoot === window) {
    return {
      top: 0,
      bottom: window.innerHeight,
      height: window.innerHeight,
    };
  }

  const rect = scrollRoot.getBoundingClientRect();

  return {
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
  };
}

function buildScrollStyle(progress, direction = "left") {
  const eased = easeOutCubic(clamp01(progress));

  const hiddenX = direction === "left" ? -150 : 150;
  const x = hiddenX * (1 - eased);
  const y = 90 * (1 - eased);
  const scale = 0.9 + 0.1 * eased;
  const blur = 18 * (1 - eased);

  return {
    opacity: eased,
    filter: `blur(${blur}px)`,
    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
  };
}

function useScrollLinkedStyle(options = {}) {
  const { direction = "left", startRatio = 1, endRatio = 0.45 } = options;

  const ref = useRef(null);
  const [style, setStyle] = useState(() => buildScrollStyle(0, direction));

  useEffect(() => {
    const node = ref.current;

    if (!node) return undefined;

    const scrollRoot = findScrollParent(node);
    const scrollTarget = scrollRoot === window ? window : scrollRoot;

    let rafId = null;

    const update = () => {
      rafId = null;

      const rootRect = getRootRect(scrollRoot);
      const elementRect = node.getBoundingClientRect();

      const startLine = rootRect.top + rootRect.height * startRatio;
      const endLine = rootRect.top + rootRect.height * endRatio;

      const rawProgress = (startLine - elementRect.top) / (startLine - endLine);
      const progress = clamp01(rawProgress);

      setStyle(buildScrollStyle(progress, direction));
    };

    const requestUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(update);
    };

    requestUpdate();

    scrollTarget.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      scrollTarget.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [direction, startRatio, endRatio]);

  return [ref, style];
}

function FeaturedPlanetCard({
  item,
  analyzeLoading,
  analyzeDisabled,
  onAnalyze,
}) {
  const [cardRef, cardStyle] = useScrollLinkedStyle({
    direction: "right",
    startRatio: 1,
    endRatio: 0.68,
  });

  const lockedStyle = analyzeDisabled
    ? {
        ...cardStyle,
        opacity: Math.min(Number(cardStyle.opacity ?? 1), 0.42),
        filter: `${cardStyle.filter ?? ""} grayscale(0.45) saturate(0.65)`,
      }
    : cardStyle;

  return (
    <button
      ref={cardRef}
      style={lockedStyle}
      onClick={() => onAnalyze(item.name)}
      disabled={analyzeLoading || analyzeDisabled}
      className="landing-scroll-linked group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {analyzeDisabled && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#030306]/35 backdrop-blur-[1px]">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-white/55">
            Login Required
          </span>
        </div>
      )}

      <div className="flex justify-between items-start gap-3 mb-3 relative z-10 min-w-0">
        <span className="min-w-0 truncate text-lg font-semibold text-[var(--text-primary)]">
          {item.name}
        </span>

        <Badge>
          {item.lang}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium relative z-10">
        <Star size={14} className="text-yellow-500" fill="currentColor" />{" "}
        {item.star} stars
      </div>

      <p className="mt-3 text-sm text-gray-400 relative z-10">
        {item.description}
      </p>
    </button>
  );
}

function extractRepoLabel(repoUrl) {
  if (!repoUrl) {
    return "";
  }

  const trimmed = repoUrl.trim();

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1].replace(".git", "")}`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { authLoading, isAuthenticated } = useAuth();

  const [repoUrl, setRepoUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const [insufficientTokenOpen, setInsufficientTokenOpen] = useState(false);

  const [analysisConfirmOpen, setAnalysisConfirmOpen] = useState(false);
  const [analysisConfirmLoading, setAnalysisConfirmLoading] = useState(false);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [pendingRepoUrl, setPendingRepoUrl] = useState("");
  const [pendingRepoLabel, setPendingRepoLabel] = useState("");

  const [recentRef, recentStyle] = useScrollLinkedStyle({
    direction: "left",
    startRatio: 1,
    endRatio: 0.45,
  });

  const [featuredHeaderRef, featuredHeaderStyle] = useScrollLinkedStyle({
    direction: "right",
    startRatio: 1,
    endRatio: 0.45,
  });

  const analyzeDisabled = authLoading || !isAuthenticated;

  useEffect(() => {
    /*
     * 이전 버전의 브라우저 단위 기록이 남아 있으면 제거합니다.
     * 이제 Recent Explorations는 localStorage가 아니라 BE repo_run 기준입니다.
     */
    localStorage.removeItem("ohss_search_history");
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setHistory([]);
      return;
    }

    loadRecentRuns();
  }, [authLoading, isAuthenticated]);

  const loadRecentRuns = async () => {
    try {
      setHistoryLoading(true);

      const recentRuns = await getRecentRuns();
      setHistory(Array.isArray(recentRuns) ? recentRuns : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const normalizeGithubRepo = (input) => {
    const trimmed = String(input ?? "").trim();

    if (!trimmed) return null;

    let match = trimmed.match(
      /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/
    );

    if (match) {
      const owner = match[1];
      const repo = match[2];

      return {
        repo: `${owner}/${repo}`,
        repoUrl: `https://github.com/${owner}/${repo}`,
      };
    }

    match = trimmed.match(/^([^/]+)\/([^/]+)$/);

    if (match) {
      const owner = match[1];
      const repo = match[2];

      return {
        repo: `${owner}/${repo}`,
        repoUrl: `https://github.com/${owner}/${repo}`,
      };
    }

    return null;
  };

  /*
   * 직접 URL 입력 Analyze 버튼과 Featured Planets 클릭이 모두 이 함수를 탑니다.
   * 여기서는 실제 분석 요청을 보내지 않고, 현재 토큰을 조회한 뒤 확인 모달만 엽니다.
   */
  const handleAnalyze = async (raw) => {
    if (!isAuthenticated) {
      setAnalyzeError("로그인 후 레포지토리 분석을 요청할 수 있습니다.");
      return;
    }

    const normalized = normalizeGithubRepo(raw ?? repoUrl);

    if (!normalized) {
      setAnalyzeError("GitHub 레포지토리 URL 형식이 올바르지 않습니다.");
      return;
    }

    try {
      setAnalyzeLoading(true);
      setAnalyzeError(null);

      const balance = await getMyTokenBalance();

      setCurrentTokens(balance?.balance ?? 0);
      setPendingRepoUrl(normalized.repoUrl);
      setPendingRepoLabel(normalized.repo);
      setAnalysisConfirmOpen(true);
    } catch (error) {
      if (error.status === 401) {
        setAnalyzeError("로그인 후 레포지토리 분석을 요청할 수 있습니다.");
        setHistory([]);
        return;
      }

      setAnalyzeError(formatUserErrorMessage(error, "토큰 정보를 조회하지 못했습니다."));
    } finally {
      setAnalyzeLoading(false);
    }
  };

  /*
   * 확인 모달에서 “분석 시작”을 눌렀을 때만 실제 분석 요청을 보냅니다.
   */
  const executeAnalyze = async () => {
    try {
      setAnalysisConfirmLoading(true);
      setAnalyzeLoading(true);
      setAnalyzeError(null);

      const run = await createRepoRun({
        repoUrl: pendingRepoUrl,
      });

      /*
       * localStorage에 저장하지 않습니다.
       * 분석 기록은 서버의 repo_run 테이블에서 사용자별로 다시 조회합니다.
       */
      await loadRecentRuns();

      setAnalysisConfirmOpen(false);

      navigate(
        `/analyze?runId=${encodeURIComponent(
          run.runId
        )}&repo=${encodeURIComponent(pendingRepoLabel)}`,
        {
          state: {
            repo: pendingRepoLabel,
            repoUrl: pendingRepoUrl,
            run,
          },
        }
      );
    } catch (error) {
      if (error.status === 401) {
        setAnalyzeError("로그인 후 레포지토리 분석을 요청할 수 있습니다.");
        setHistory([]);
        return;
      }

      if (error.code === "TOKEN402_1") {
        setAnalysisConfirmOpen(false);
        setInsufficientTokenOpen(true);
        return;
      }

      setAnalyzeError(formatUserErrorMessage(error, "레포지토리 분석 요청에 실패했습니다."));
    } finally {
      setAnalysisConfirmLoading(false);
      setAnalyzeLoading(false);
    }
  };

  const handleClickRecentRun = (item) => {
    if (typeof item === "string") {
      handleAnalyze(item);
      return;
    }

    const repo = item.repoFullName || item.repoUrl;

    if (!item.runId || !repo) return;

    navigate(
      `/analyze?runId=${encodeURIComponent(
        item.runId
      )}&repo=${encodeURIComponent(repo)}`,
      {
        state: {
          repo,
          repoUrl: item.repoUrl,
          run: item,
        },
      }
    );
  };

  const featuredPlanets = [
    {
      name: "apache/commons-cli",
      lang: "Java Library",
      star: "CLI",
      color: "from-cyan-400 to-blue-300",
      description: "명령행 옵션 파싱 라이브러리",
    },
    {
      name: "apache/commons-lang",
      lang: "Java Library",
      star: "Utils",
      color: "from-indigo-400 to-purple-300",
      description: "문자열, 객체, 날짜 등 Java 유틸리티 라이브러리",
    },
    {
      name: "google/guava",
      lang: "Java Library",
      star: "Core",
      color: "from-green-400 to-emerald-300",
      description: "컬렉션, 캐싱, 문자열, I/O 등을 제공하는 핵심 라이브러리",
    },
    {
      name: "FasterXML/jackson-databind",
      lang: "Java Library",
      star: "JSON",
      color: "from-orange-400 to-yellow-300",
      description: "JSON 직렬화와 역직렬화를 담당하는 데이터 바인딩 라이브러리",
    },
    {
      name: "square/okhttp",
      lang: "Java Library",
      star: "HTTP",
      color: "from-sky-400 to-cyan-300",
      description: "Java와 Android에서 사용하는 HTTP 클라이언트 라이브러리",
    },
    {
      name: "mockito/mockito",
      lang: "Java Library",
      star: "Test",
      color: "from-pink-400 to-rose-300",
      description: "Java 단위 테스트를 위한 mocking 프레임워크",
    },
  ];

  return (
    <div className="relative z-10">
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center px-6">
        {/* 첫 화면: 검색바를 더 중앙에 배치 */}
        <section className="landing-hero flex min-h-[calc(100vh+120px)] w-full flex-col items-center justify-center pt-24 pb-36 text-center">
          <div className="mb-12">
            <h2 className="mb-8 text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-5xl">
              Open-source code, mapped.
            </h2>

            <p className="text-sm md:text-base text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
              GitHub 레포지토리를 분석하여{" "}
              <span className="font-semibold text-cyan-200">
                시각적인 우주
              </span>
              로 펼쳐드립니다.
            </p>
          </div>

          <div className="w-full max-w-4xl relative">
            <SearchBar
              repoUrl={repoUrl}
              onChange={setRepoUrl}
              onAnalyze={() => handleAnalyze()}
              loading={analyzeLoading}
              disabled={analyzeDisabled}
              loginRequired={!authLoading && !isAuthenticated}
            />

            {analyzeError && (
              <p className="mt-5 text-center text-sm text-red-300">
                {analyzeError}
              </p>
            )}
          </div>

          <div className="landing-scroll-hint mt-16 flex flex-col items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100/50">
            <span>Scroll</span>
            <span className="h-8 w-px rounded-full bg-cyan-300/45" />
          </div>
        </section>

        {/* 스크롤 위치에 따라 계속 움직이는 영역 */}
        <section className="w-full pb-[42vh] md:pb-[36vh]">
          <div className="w-full grid md:grid-cols-2 gap-16 items-start">
            {/* Recent Explorations */}
            <div
              ref={recentRef}
              style={recentStyle}
              className="landing-scroll-linked"
            >
              <SearchHistory
                items={history}
                authenticated={isAuthenticated}
                loading={historyLoading}
                onClickItem={handleClickRecentRun}
              />
            </div>

            {/* Featured Planets */}
            <section>
              <div
                ref={featuredHeaderRef}
                style={featuredHeaderStyle}
                className="landing-scroll-linked flex items-center gap-3 mb-8 min-w-0"
              >
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2">
                  <Star size={24} className="text-yellow-300" />
                </div>

                <h3 className="text-2xl font-semibold tracking-wide">
                  Try an example
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {featuredPlanets.map((item) => (
                  <FeaturedPlanetCard
                    key={item.name}
                    item={item}
                    analyzeLoading={analyzeLoading}
                    analyzeDisabled={analyzeDisabled}
                    onAnalyze={handleAnalyze}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>

      <AnalysisRequestConfirmModal
        open={analysisConfirmOpen}
        repoLabel={pendingRepoLabel || extractRepoLabel(pendingRepoUrl)}
        currentTokens={currentTokens}
        loading={analysisConfirmLoading}
        onClose={() => {
          if (!analysisConfirmLoading) {
            setAnalysisConfirmOpen(false);
          }
        }}
        onConfirm={executeAnalyze}
        onCharge={() => {
          setAnalysisConfirmOpen(false);
          navigate("/mypage");
        }}
      />

      <InsufficientTokenModal
        open={insufficientTokenOpen}
        requiredTokens={TOKEN_COST.ANALYSIS}
        title="분석에 필요한 토큰이 부족합니다."
        description="일반 분석 요청에는 2,000토큰이 필요합니다. 토큰을 충전한 뒤 다시 요청해주세요."
        currentTokens={currentTokens}
        onClose={() => setInsufficientTokenOpen(false)}
        onCharge={() => {
          setInsufficientTokenOpen(false);
          navigate("/mypage");
        }}
      />
    </div>
  );
}
