import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";
import AnalyzeProgressPanel from "./components/AnalyzeProgressPanel";
import LlmResultSection from "./components/LlmResultSection";

import { getArtifactJson, getRunProgress } from "../../features/run/api/runApi";

const EMPTY_LLM_RESULTS = {
  scenarioSpecs: null,
  subsystemSummaries: null,
  apiDocs: null,
  fileTreeDocs: null,
};

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

  /*
   * 프론트는 백엔드 자동 파이프라인 진행 상태만 polling합니다.
   * 분석 완료 후 산출물 id를 이용해 결과 JSON을 읽어옵니다.
   */
  useEffect(() => {
    if (!runId) return;

    let cancelled = false;
    let timerId = null;
    let artifactLoaded = false;

    const poll = async () => {
      try {
        const nextProgress = await getRunProgress(runId);

        if (cancelled) return;

        setProgress(nextProgress);
        setProgressError(null);

        const status = nextProgress?.status;

        if (status === "QUEUED" || status === "RUNNING") {
          timerId = window.setTimeout(poll, 1500);
          return;
        }

        if (
          !artifactLoaded &&
          (status === "SUCCESS" || status === "PARTIAL_SUCCESS")
        ) {
          artifactLoaded = true;
          await loadArtifacts(nextProgress);
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

  const loadArtifacts = async (progressResult) => {
    await Promise.allSettled([
      loadClassDiagramArtifact(progressResult),
      loadLlmArtifacts(progressResult),
    ]);
  };

  const loadClassDiagramArtifact = async (progressResult) => {
    const classDiagramArtifactId =
      progressResult?.artifacts?.classDiagramArtifactId;

    const classMapFailed = progressResult?.failedSteps?.find(
      (step) => step.stage === "CLASSMAP"
    );

    if (!classDiagramArtifactId) {
      setClassDiagram(null);

      if (classMapFailed) {
        setClassDiagramError(classMapFailed.message);
      }

      return;
    }

    try {
      setClassDiagramLoading(true);
      setClassDiagramError(null);

      const artifact = await getArtifactJson(classDiagramArtifactId);

      setClassDiagram(artifact?.content ?? null);
    } catch (e) {
      setClassDiagram(null);
      setClassDiagramError(
        e?.message ?? "클래스 다이어그램 산출물을 불러오지 못했습니다."
      );
    } finally {
      setClassDiagramLoading(false);
    }
  };

  const loadLlmArtifacts = async (progressResult) => {
    const artifactIds = {
      scenarioSpecs:
        progressResult?.artifacts?.llmScenarioSpecsArtifactId ?? null,
      subsystemSummaries:
        progressResult?.artifacts?.llmSubsystemSummariesArtifactId ?? null,
      apiDocs: progressResult?.artifacts?.llmApiDocsArtifactId ?? null,
      fileTreeDocs:
        progressResult?.artifacts?.llmFileTreeDocsArtifactId ?? null,
    };

    const hasAnyLlmArtifactId = Object.values(artifactIds).some(Boolean);

    if (!hasAnyLlmArtifactId) {
      setLlmResults(EMPTY_LLM_RESULTS);
      return;
    }

    try {
      setLlmLoading(true);
      setLlmError(null);

      const settled = await Promise.allSettled(
        Object.entries(artifactIds).map(async ([key, artifactId]) => {
          if (!artifactId) {
            return [key, null];
          }

          const artifact = await getArtifactJson(artifactId);
          return [key, artifact?.content ?? null];
        })
      );

      const nextResults = { ...EMPTY_LLM_RESULTS };
      const failedKeys = [];

      settled.forEach((result) => {
        if (result.status === "fulfilled") {
          const [key, content] = result.value;
          nextResults[key] = content;
        } else {
          failedKeys.push("일부 LLM 산출물");
        }
      });

      setLlmResults(nextResults);

      if (failedKeys.length > 0) {
        setLlmError("일부 LLM 결과 산출물을 불러오지 못했습니다.");
      }
    } catch (e) {
      setLlmResults(EMPTY_LLM_RESULTS);
      setLlmError(e?.message ?? "LLM 결과 산출물을 불러오지 못했습니다.");
    } finally {
      setLlmLoading(false);
    }
  };

  const refreshLlmResults = async () => {
    if (!runId) return;

    try {
      const latestProgress = await getRunProgress(runId);
      setProgress(latestProgress);
      await loadLlmArtifacts(latestProgress);
    } catch (e) {
      setLlmError(e?.message ?? "LLM 결과를 새로고침하지 못했습니다.");
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

        <RepoInfoSection
          repo={repo}
          info={repoInfo}
          loading={repoInfoLoading}
          error={repoInfoError}
        />

        {progressError && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-200">
            {progressError}
          </div>
        )}

        <AnalyzeProgressPanel progress={progress} />

        <div className="flex flex-col gap-8">
          <LlmResultSection
            results={llmResults}
            loading={llmLoading}
            error={llmError}
            onRefresh={refreshLlmResults}
          />

          <ClassDiagramSection
            classDiagram={classDiagram}
            loading={classDiagramLoading}
            error={classDiagramError || classMapFailed?.message}
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