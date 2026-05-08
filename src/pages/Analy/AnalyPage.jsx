import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";
import {
  buildClassMap,
  getArtifactJson,
} from "../../features/classmap/api/classMapApi";

export default function AnalyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const run = location.state?.run;
  const runId = run?.runId ?? searchParams.get("runId");
  const repo = location.state?.repo ?? searchParams.get("repo");

  const [repoInfo, setRepoInfo] = useState(null);
  const [repoInfoLoading, setRepoInfoLoading] = useState(false);
  const [repoInfoError, setRepoInfoError] = useState(null);

  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [classDiagram, setClassDiagram] = useState(null);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [diagramError, setDiagramError] = useState(null);

  useEffect(() => {
    if (!repo) return;

    const [owner, name] = repo.split("/");

    (async () => {
      try {
        setRepoInfoLoading(true);
        setRepoInfoError(null);

        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`);

        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status}`);
        }

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

        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/contents`
        );

        if (!res.ok) {
          throw new Error(`GitHub contents error: ${res.status}`);
        }

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

  useEffect(() => {
    if (!runId) {
      setClassDiagram(null);
      return;
    }

    let ignore = false;

    (async () => {
      try {
        setDiagramLoading(true);
        setDiagramError(null);
        setClassDiagram(null);

        const buildResult = await buildClassMap({
          runId,
          maxNodes: 120,
          maxEdges: 240,
          startHereTopN: 8,
        });

        const artifactId = buildResult?.classDiagramArtifactId;

        if (!artifactId) {
          throw new Error("classDiagramArtifactId가 응답에 없습니다.");
        }

        const artifactResult = await getArtifactJson(artifactId);

        const diagram = artifactResult?.content;

        if (!diagram) {
          throw new Error("artifact content에 class_diagram.json이 없습니다.");
        }

        if (!ignore) {
          setClassDiagram(diagram);
        }
      } catch (e) {
        if (!ignore) {
          setClassDiagram(null);
          setDiagramError(
            e?.message ?? "클래스다이어그램을 불러오지 못했습니다."
          );
        }
      } finally {
        if (!ignore) {
          setDiagramLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [runId]);

  const toggleFolder = async (path) => {
    if (!repo) return;

    const [owner, name] = repo.split("/");
    const isOpen = !!expanded[path];

    setExpanded((prev) => ({ ...prev, [path]: !isOpen }));

    if (isOpen) return;

    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${name}/contents/${path}`
      );

      if (!res.ok) {
        throw new Error(`GitHub contents error: ${res.status}`);
      }

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
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Home
        </button>

        <RepoInfoSection
          repo={repo}
          info={repoInfo}
          loading={repoInfoLoading}
          error={repoInfoError}
        />

        <div className="flex flex-col gap-8">
          <ClassDiagramSection
            classDiagram={classDiagram}
            loading={diagramLoading}
            error={diagramError}
          />

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