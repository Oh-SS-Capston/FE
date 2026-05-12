import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

import SearchBar from "./components/SearchBar";
import SearchHistory from "./components/SearchHistory";
import { useAuth } from "../../features/auth/model/AuthContext";
import { createRepoRun, getRecentRuns } from "../../features/run/api/runApi";

export default function LandingPage() {
  const navigate = useNavigate();
  const { authLoading, isAuthenticated } = useAuth();

  const [repoUrl, setRepoUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const analyzeDisabled = authLoading || !isAuthenticated;

  useEffect(() => {
    /*
     * 이전 버전의 브라우저 단위 기록이 남아 있으면 제거합니다.
     * 이제 Recent Explorations는 localStorage가 아니라 BE repo_run 기준입니다.
     */
    localStorage.removeItem("ohss_search_history");
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

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
    const trimmed = input.trim();

    if (!trimmed) {
      return null;
    }

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

      const run = await createRepoRun({
        repoUrl: normalized.repoUrl,
      });

      /*
       * localStorage에 저장하지 않습니다.
       * 분석 기록은 서버의 repo_run 테이블에서 사용자별로 다시 조회합니다.
       */
      await loadRecentRuns();

      navigate(
        `/analyze?runId=${encodeURIComponent(
          run.runId
        )}&repo=${encodeURIComponent(normalized.repo)}`,
        {
          state: {
            repo: normalized.repo,
            repoUrl: normalized.repoUrl,
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

      setAnalyzeError(
        error.message ?? "레포지토리 분석 요청에 실패했습니다."
      );
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleClickRecentRun = (item) => {
  if (typeof item === "string") {
    handleAnalyze(item);
    return;
  }

  const repo = item.repoFullName || item.repoUrl;

  if (!item.runId || !repo) {
    return;
  }

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

  return (
    <div className="relative z-10">
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center px-6 pt-40 pb-20">
        <section className="text-center mb-20">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-8 tracking-tight leading-tight">
            Explore the <br className="md:hidden" />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">
              Galaxy
            </span>{" "}
            of OSS (Open Source Software)
          </h2>

          <p className="text-sm md:text-base text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
            GitHub 레포지토리를 분석하여{" "}
            <span className="text-purple-300 font-semibold drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
              시각적인 우주
            </span>
            로 펼쳐드립니다.
          </p>
        </section>

        <div className="w-full max-w-4xl mb-32 relative">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full blur-xl opacity-30 animate-tilt" />

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

        <div className="w-full grid md:grid-cols-2 gap-16">
          <SearchHistory
            items={history}
            authenticated={isAuthenticated}
            loading={historyLoading}
            onClickItem={handleClickRecentRun}
          />

          <section>
            <div className="flex items-center gap-3 mb-8 min-w-0">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <Star size={24} className="text-yellow-300" />
              </div>

              <h3 className="text-2xl font-bold tracking-wide">
                Featured Planets
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
{[
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
].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleAnalyze(item.name)}
                  disabled={analyzeLoading || analyzeDisabled}
                  className="group p-6 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md border border-white/10 rounded-3xl hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all text-left relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="flex justify-between items-start gap-3 mb-3 relative z-10 min-w-0">
                    <span className="min-w-0 truncate text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300 group-hover:from-purple-300 group-hover:to-cyan-300 transition-all">
                      {item.name}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${item.color} text-[#050510] shadow-sm`}
                    >
                      {item.lang}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium relative z-10">
                    <Star
                      size={14}
                      className="text-yellow-500"
                      fill="currentColor"
                    />{" "}
                    {item.star} stars
                  </div>

                  <p className="mt-3 text-sm text-gray-400 relative z-10">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}