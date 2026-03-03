import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Star } from "lucide-react";

import SearchBar from "./components/SearchBar";
import SearchHistory from "./components/SearchHistory";
import { addHistory, clearHistory, getHistory } from "../../features/search/model/searchHistoryStore";

// 별 위치 고정
const STAR_SEED = 42;
const mulberry32 = (a) => () => ((a += 0x6d2b79f5) | 0) >>> 0;
const seededRandom = (seed) => {
  const next = mulberry32(seed);
  return () => next() / 0xffffffff;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const parseRepo = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const match =
      trimmed.match(/github\.com[/]([^/]+)[/]([^/?#]+)/) ||
      trimmed.match(/^([^/]+)[/]([^/]+)$/);
    if (!match) return trimmed;
    return `${match[1]}/${match[2]}`;
  };

  const handleAnalyze = (raw) => {
    const repo = parseRepo(raw ?? repoUrl);
    if (!repo) return;
    const next = addHistory(repo);
    setHistory(next);

    // 기존과 동일: /analyze 로 이동 + state로 repo 전달
    navigate("/analyze", { state: { repo } });
  };

  const starStyle = useMemo(() => {
    const rnd = seededRandom(STAR_SEED);
    const shadows = Array.from({ length: 120 }, () => {
      const x = rnd() * 100;
      const y = rnd() * 100;
      const blur = rnd() * 1.5;
      const spread = rnd() * 1;
      const alpha = 0.15 + rnd() * 0.35;
      return `${x}vw ${y}vh ${blur}px ${spread}px rgba(255,255,255,${alpha})`;
    }).join(", ");
    return { boxShadow: shadows };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-[#050512] text-white">
      {/* stars */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-0 top-0 h-[2px] w-[2px]" style={starStyle} />
      </div>

      {/* gradient blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-purple-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-16">
        {/* Hero */}
        <div className="w-full max-w-[920px] rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <Github className="text-purple-300" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              OSS Documentation, Generated from Code
            </h1>
          </div>

          <p className="text-white/70 text-lg mb-10">
            GitHub 레포 URL을 넣으면, Public API / Diagram / Evidence 기반 설명을 탐색할 수 있어요.
          </p>

          <SearchBar repoUrl={repoUrl} onChange={setRepoUrl} onAnalyze={() => handleAnalyze()} />
        </div>

        {/* Bottom sections */}
        <div className="w-full grid md:grid-cols-2 gap-16 mt-16">
          <SearchHistory
            items={history}
            onClickItem={(repo) => handleAnalyze(repo)}
            onClear={() => {
              clearHistory();
              setHistory([]);
            }}
          />

          {/* Recommendations (기존 하드코딩 섹션 느낌 유지) */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <Star size={24} className="text-purple-200" />
              </div>
              <h3 className="text-2xl font-bold tracking-wide">Recommendations</h3>
            </div>

            <div className="space-y-4">
              {["facebook/react", "spring-projects/spring-boot", "apache/kafka"].map((repo) => (
                <button
                  key={repo}
                  onClick={() => handleAnalyze(repo)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-[#0a0a1a]/60 p-4 text-white hover:border-cyan-300/40 hover:bg-[#0a0a1a]/80 transition"
                >
                  {repo}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}