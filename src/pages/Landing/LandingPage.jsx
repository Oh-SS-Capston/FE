import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { History, Star } from "lucide-react";

import SearchBar from "./components/SearchBar";
import SearchHistory from "./components/SearchHistory";
import { addHistory, clearHistory, getHistory } from "../../features/search/model/searchHistoryStore";

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
    let match =
      trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\.git$/);
    if (match) return `${match[1]}/${match[2]}`;

    match = trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
    if (match) return `${match[1]}/${match[2]}`;

    match = trimmed.match(/^([^/]+)\/([^/]+)$/);
    if (match) return `${match[1]}/${match[2]}`;

    return null;
  };

  const handleAnalyze = (raw) => {
    const repo = parseRepo(raw ?? repoUrl);
    if (!repo) return;
    const next = addHistory(repo);
    setHistory(next);
    navigate("/analyze", { state: { repo } });
  };

  return (
    <div className="relative z-10">
      <main className="pt-40 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center">

        {/* Hero Section */}
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

        {/* SearchBar */}
        <div className="w-full max-w-4xl mb-32 relative">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full blur-xl opacity-30 animate-tilt" />
          <SearchBar
            repoUrl={repoUrl}
            onChange={setRepoUrl}
            onAnalyze={() => handleAnalyze()}
          />
        </div>

        {/* Bottom Sections */}
        <div className="w-full grid md:grid-cols-2 gap-16">

          {/* 검색 기록 */}
          <SearchHistory
            items={history}
            onClickItem={(repo) => handleAnalyze(repo)}
            onClear={() => {
              clearHistory();
              setHistory([]);
            }}
          />

          {/* 추천 레포지토리 */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <Star size={24} className="text-yellow-300" />
              </div>
              <h3 className="text-2xl font-bold tracking-wide">Featured Planets</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { name: "facebook/react",             lang: "JavaScript", star: "220k", color: "from-blue-400 to-cyan-300"    },
                { name: "spring-projects/spring-boot", lang: "Java",       star: "72k",  color: "from-green-400 to-emerald-300" },
                { name: "apache/kafka",                lang: "Java",       star: "28k",  color: "from-orange-400 to-yellow-300" },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleAnalyze(item.name)}
                  className="group p-6 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md border border-white/10 rounded-3xl hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300 group-hover:from-purple-300 group-hover:to-cyan-300 transition-all">
                      {item.name}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${item.color} text-[#050510] shadow-sm`}>
                      {item.lang}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium relative z-10">
                    <Star size={14} className="text-yellow-500" fill="currentColor" /> {item.star} stars
                  </div>
                </button>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
