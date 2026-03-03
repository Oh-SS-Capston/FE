import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";

const STAR_SEED = 42;
const mulberry32 = (a) => () => ((a += 0x6d2b79f5) | 0) >>> 0;
const seededRandom = (seed) => {
  const next = mulberry32(seed);
  return () => next() / 0xffffffff;
};

export default function AnalyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const repo = location.state?.repo;

  const [repoInfo, setRepoInfo] = useState(null);
  const [repoInfoLoading, setRepoInfoLoading] = useState(false);
  const [repoInfoError, setRepoInfoError] = useState(null);

  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);

  const [expanded, setExpanded] = useState({});
  const [diagramSvg, setDiagramSvg] = useState(null); // 지금은 null (백엔드 연동 시 채우기)

  useEffect(() => {
    if (!repo) return;
    const [owner, name] = repo.split("/");

    // repo info fetch
    (async () => {
      try {
        setRepoInfoLoading(true);
        setRepoInfoError(null);

        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`);
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const data = await res.json();
        setRepoInfo(data);
      } catch (e) {
        setRepoInfoError(e?.message ?? String(e));
      } finally {
        setRepoInfoLoading(false);
      }
    })();

    // directory tree (root)
    (async () => {
      try {
        setTreeLoading(true);
        setTreeError(null);

        const res = await fetch(`https://api.github.com/repos/${owner}/${name}/contents`);
        if (!res.ok) throw new Error(`GitHub contents error: ${res.status}`);
        const items = await res.json();

        const normalized = items.map((it) => ({
          name: it.name,
          path: it.path,
          type: it.type, // 'file' | 'dir'
          children: [],
        }));

        setTree(normalized);
      } catch (e) {
        setTreeError(e?.message ?? String(e));
      } finally {
        setTreeLoading(false);
      }
    })();
  }, [repo]);

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

  const toggleFolder = async (path) => {
    if (!repo) return;
    const [owner, name] = repo.split("/");

    const isOpen = !!expanded[path];
    setExpanded((prev) => ({ ...prev, [path]: !isOpen }));

    // 이미 열려있던 폴더면 닫기만
    if (isOpen) return;

    // children 불러오기 (현재 tree 구조에서 해당 폴더를 찾아 children 채우기)
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`);
      if (!res.ok) throw new Error(`GitHub contents error: ${res.status}`);
      const children = await res.json();

      setTree((prev) =>
        prev.map((node) => {
          if (node.path !== path) return node;
          return {
            ...node,
            children: children.map((c) => ({
              name: c.name,
              path: c.path,
              type: c.type,
            })),
          };
        })
      );
    } catch {
      // children 실패는 조용히 무시(UX 선택)
    }
  };

  if (!repo) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#050512] text-white flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-white/70 mb-4">레포 정보가 없습니다. Landing에서 레포를 입력해주세요.</p>
          <button
            className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 font-semibold"
            onClick={() => navigate("/")}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-[#050512] text-white">
      {/* stars */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-0 top-0 h-[2px] w-[2px]" style={starStyle} />
      </div>

      {/* gradient blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-purple-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="mx-auto max-w-[1200px] px-6 py-10 space-y-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <RepoInfoSection
          repo={repo}
          info={repoInfo}
          loading={repoInfoLoading}
          error={repoInfoError}
        />

        <div className="grid lg:grid-cols-2 gap-8">
          <ClassDiagramSection diagramSvg={diagramSvg} />
          <DirectoryStructureSection
            tree={tree}
            loading={treeLoading}
            error={treeError}
            expanded={expanded}
            onToggle={toggleFolder}
          />
        </div>
      </div>
    </div>
  );
}