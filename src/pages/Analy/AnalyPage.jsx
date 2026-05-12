import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";
import AnalyzeProgressPanel from "./components/AnalyzeProgressPanel";
import LlmResultSection from "./components/LlmResultSection";
import PackageClassDocsSection from "./components/PackageClassDocsSection";

import { getArtifactJson, getRunProgress } from "../../features/run/api/runApi";

const EMPTY_LLM_RESULTS = {
  scenarioSpecs: null,
  subsystemSummaries: null,
  apiDocs: null,
  fileTreeDocs: null,
};

function unwrapApiResponse(response) {
  return response?.result ?? response;
}

export default function AnalyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const run = location.state?.run;
  const runId = run?.runId ?? searchParams.get("runId");
  const repo = location.state?.repo ?? searchParams.get("repo");

  const loadedArtifactIdsRef = useRef({
    classDiagram: null,
    llm: {
      scenarioSpecs: null,
      subsystemSummaries: null,
      apiDocs: null,
      fileTreeDocs: null,
    },
  });

  const [repoInfo, setRepoInfo] = useState(null);
  const [repoInfoLoading, setRepoInfoLoading] = useState(false);
  const [repoInfoError, setRepoInfoError] = useState(null);

  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState(null);

  const [classDiagram, setClassDiagram] = useState(null);
  const [classDiagramLoading, setClassDiagramLoading] = useState(false);
  const [classDiagramError, setClassDiagramError] = useState(null);

  const [llmResults, setLlmResults] = useState(EMPTY_LLM_RESULTS);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState(null);

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
    if (!runId) return;

    let cancelled = false;
    let timerId = null;

    loadedArtifactIdsRef.current = {
      classDiagram: null,
      llm: {
        scenarioSpecs: null,
        subsystemSummaries: null,
        apiDocs: null,
        fileTreeDocs: null,
      },
    };

    setClassDiagram(null);
    setClassDiagramError(null);
    setLlmResults(EMPTY_LLM_RESULTS);
    setLlmError(null);

    const loadArtifactContent = async (artifactId) => {
      const response = await getArtifactJson(artifactId);
      const artifact = unwrapApiResponse(response);
      return artifact?.content ?? null;
    };

    const loadClassDiagramIfReady = async (nextProgress) => {
      const artifactId = nextProgress?.artifacts?.classDiagramArtifactId;

      const classMapFailed = nextProgress?.failedSteps?.find(
        (step) => step.stage === "CLASSMAP"
      );

      if (!artifactId) {
        if (classMapFailed) {
          setClassDiagramError(classMapFailed.message);
        }

        return;
      }

      if (loadedArtifactIdsRef.current.classDiagram === artifactId) {
        return;
      }

      try {
        loadedArtifactIdsRef.current.classDiagram = artifactId;
        setClassDiagramLoading(true);
        setClassDiagramError(null);

        const content = await loadArtifactContent(artifactId);

        if (!cancelled) {
          setClassDiagram(content);
        }
      } catch (e) {
        loadedArtifactIdsRef.current.classDiagram = null;

        if (!cancelled) {
          setClassDiagram(null);
          setClassDiagramError(
            e?.message ?? "클래스 다이어그램 산출물을 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setClassDiagramLoading(false);
        }
      }
    };

    const loadLlmArtifactsIfReady = async (nextProgress) => {
      const artifactMap = {
        scenarioSpecs:
          nextProgress?.artifacts?.llmScenarioSpecsArtifactId ?? null,
        subsystemSummaries:
          nextProgress?.artifacts?.llmSubsystemSummariesArtifactId ?? null,
        apiDocs: nextProgress?.artifacts?.llmApiDocsArtifactId ?? null,
        fileTreeDocs:
          nextProgress?.artifacts?.llmFileTreeDocsArtifactId ?? null,
      };

      const pendingEntries = Object.entries(artifactMap).filter(
        ([key, artifactId]) =>
          artifactId &&
          loadedArtifactIdsRef.current.llm[key] !== artifactId
      );

      if (pendingEntries.length === 0) {
        return;
      }

      try {
        setLlmLoading(true);
        setLlmError(null);

        const settled = await Promise.allSettled(
          pendingEntries.map(async ([key, artifactId]) => {
            const content = await loadArtifactContent(artifactId);
            return [key, artifactId, content];
          })
        );

        if (cancelled) return;

        let hasFailure = false;

        settled.forEach((result) => {
          if (result.status === "fulfilled") {
            const [key, artifactId, content] = result.value;

            loadedArtifactIdsRef.current.llm[key] = artifactId;

            setLlmResults((prev) => ({
              ...prev,
              [key]: content,
            }));
          } else {
            hasFailure = true;
          }
        });

        if (hasFailure) {
          setLlmError("일부 LLM 결과 산출물을 불러오지 못했습니다.");
        }
      } catch (e) {
        if (!cancelled) {
          setLlmError(e?.message ?? "LLM 결과 산출물을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLlmLoading(false);
        }
      }
    };

    const poll = async () => {
      try {
        const response = await getRunProgress(runId);
        const nextProgress = unwrapApiResponse(response);

        if (cancelled) return;

        setProgress(nextProgress);
        setProgressError(null);

        /*
         * 핵심 변경:
         * 전체 파이프라인 SUCCESS를 기다리지 않고,
         * artifact id가 생기는 순간 바로 결과를 조회합니다.
         */
        await Promise.allSettled([
          loadClassDiagramIfReady(nextProgress),
          loadLlmArtifactsIfReady(nextProgress),
        ]);

        const status = nextProgress?.status;

        if (status === "QUEUED" || status === "RUNNING") {
          timerId = window.setTimeout(poll, 1500);
        }
      } catch (e) {
        if (cancelled) return;

        setProgressError(e?.message ?? "분석 진행 상태를 불러오지 못했습니다.");
        timerId = window.setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      cancelled = true;

      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [runId]);

  const refreshLlmResults = async () => {
    if (!runId) return;

    try {
      const response = await getRunProgress(runId);
      const latestProgress = unwrapApiResponse(response);

      setProgress(latestProgress);

      loadedArtifactIdsRef.current.llm = {
        scenarioSpecs: null,
        subsystemSummaries: null,
        apiDocs: null,
        fileTreeDocs: null,
      };

      setLlmResults(EMPTY_LLM_RESULTS);

      const artifactMap = {
        scenarioSpecs:
          latestProgress?.artifacts?.llmScenarioSpecsArtifactId ?? null,
        subsystemSummaries:
          latestProgress?.artifacts?.llmSubsystemSummariesArtifactId ?? null,
        apiDocs: latestProgress?.artifacts?.llmApiDocsArtifactId ?? null,
        fileTreeDocs:
          latestProgress?.artifacts?.llmFileTreeDocsArtifactId ?? null,
      };

      const entries = Object.entries(artifactMap).filter(([, id]) => id);

      if (entries.length === 0) return;

      setLlmLoading(true);
      setLlmError(null);

      const settled = await Promise.allSettled(
        entries.map(async ([key, artifactId]) => {
          const artifactResponse = await getArtifactJson(artifactId);
          const artifact = unwrapApiResponse(artifactResponse);
          return [key, artifactId, artifact?.content ?? null];
        })
      );

      let hasFailure = false;

      settled.forEach((result) => {
        if (result.status === "fulfilled") {
          const [key, artifactId, content] = result.value;

          loadedArtifactIdsRef.current.llm[key] = artifactId;

          setLlmResults((prev) => ({
            ...prev,
            [key]: content,
          }));
        } else {
          hasFailure = true;
        }
      });

      if (hasFailure) {
        setLlmError("일부 LLM 결과를 새로고침하지 못했습니다.");
      }
    } catch (e) {
      setLlmError(e?.message ?? "LLM 결과를 새로고침하지 못했습니다.");
    } finally {
      setLlmLoading(false);
    }
  };

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
      // 디렉토리 펼치기 실패는 전체 분석 실패로 처리하지 않습니다.
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

  const classMapFailed = progress?.failedSteps?.find(
    (step) => step.stage === "CLASSMAP"
  );

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

        {/* 1. 레포 프로필 */}
        <RepoInfoSection
          repo={repo}
          info={repoInfo}
          loading={repoInfoLoading}
          error={repoInfoError}
        />

        {/* 2. 레포 디렉토리 구조 */}
        <DirectoryStructureSection
          tree={tree}
          loading={treeLoading}
          error={treeError}
          expanded={expanded}
          onToggle={toggleFolder}
        />

        {/* 3. 작업 프로세스 */}
        {progressError && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-200">
            {progressError}
          </div>
        )}

        <AnalyzeProgressPanel progress={progress} />

        {/* 4. 클래스 다이어그램 */}
        <ClassDiagramSection
          classDiagram={classDiagram}
          loading={classDiagramLoading}
          error={classDiagramError || classMapFailed?.message}
        />

        {/* 4-1. 패키지별 클래스/메서드 문서 */}
        <PackageClassDocsSection
          fileTreeDocs={llmResults.fileTreeDocs}
          loading={llmLoading && !llmResults.fileTreeDocs}
          error={llmError}
        />

        {/* 5. LLM Result */}
        <LlmResultSection
          results={llmResults}
          loading={llmLoading}
          error={llmError}
          onRefresh={refreshLlmResults}
        />
      </div>
    </div>
  );
}