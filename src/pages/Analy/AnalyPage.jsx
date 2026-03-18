import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";

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
  const [diagramSvg, setDiagramSvg] = useState(null);

  useEffect(() => {
    if (!repo) return;
    const [owner, name] = repo.split("/");

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

    (async () => {
      try {
        setTreeLoading(true);
        setTreeError(null);
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}/contents`);
        if (!res.ok) throw new Error(`GitHub contents error: ${res.status}`);
        const items = await res.json();
        setTree(
          items.map((it) => ({
            name: it.name,
            path: it.path,
            type: it.type,
            children: [],
          }))
        );
      } catch (e) {
        setTreeError(e?.message ?? String(e));
      } finally {
        setTreeLoading(false);
      }
    })();
  }, [repo]);

  const toggleFolder = async (path) => {
    if (!repo) return;
    const [owner, name] = repo.split("/");
    const isOpen = !!expanded[path];
    setExpanded((prev) => ({ ...prev, [path]: !isOpen }));
    if (isOpen) return;

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`);
      if (!res.ok) throw new Error(`GitHub contents error: ${res.status}`);
      const children = await res.json();
      setTree((prev) =>
        prev.map((node) => {
          if (node.path !== path) return node;
          return {
            ...node,
            children: children.map((c) => ({ name: c.name, path: c.path, type: c.type })),
          };
        })
      );
    } catch {
      // 조용히 무시
    }
  };

  if (!repo) {
    return (
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">레포지토리 정보가 없습니다.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            랜딩으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="w-[90vw] mx-auto px-6 py-10 space-y-8">
        {/* Back 버튼 */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <ArrowLeft size={18} /> Home
        </button>

        <RepoInfoSection
          repo={repo}
          info={repoInfo}
          loading={repoInfoLoading}
          error={repoInfoError}
        />

        <div className="flex flex-col gap-8">
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
