import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";
import AnalyzeProgressPanel from "./components/AnalyzeProgressPanel";
import LlmResultSection from "./components/LlmResultSection";
import PackageClassDocsSection from "./components/PackageClassDocsSection";

import { getArtifactJson, getRunProgress } from "../../features/run/api/runApi";

const LLM_RESULT_KEYS = [
  "scenarioSpecs",
  "subsystemSummaries",
  "apiDocs",
  "fileTreeDocs",
  "refinedRules",
];

const LLM_ARTIFACT_TYPE_TOKEN = {
  scenarioSpecs: ["LLM_SCENARIO_SPECS", "SCENARIO_SPECS"],
  subsystemSummaries: ["LLM_SUBSYSTEM_SUMMARIES", "SUBSYSTEM_SUMMARIES"],
  apiDocs: ["LLM_API_DOCS", "API_DOCS"],
  fileTreeDocs: ["LLM_FILE_TREE_DOCS", "FILE_TREE_DOCS"],
  refinedRules: ["LLM_REFINED_RULES", "REFINED_RULES", "LLM_RULES"],
};

const LLM_DIRECT_ARTIFACT_FIELDS = {
  scenarioSpecs: [
    "llmScenarioSpecsArtifactId",
    "scenarioSpecsArtifactId",
    "llmScenarioSpecsId",
    "scenarioSpecsId",
  ],
  subsystemSummaries: [
    "llmSubsystemSummariesArtifactId",
    "subsystemSummariesArtifactId",
    "llmSubsystemSummariesId",
    "subsystemSummariesId",
  ],
  apiDocs: [
    "llmApiDocsArtifactId",
    "apiDocsArtifactId",
    "llmApiDocsId",
    "apiDocsId",
  ],
  fileTreeDocs: [
    "llmFileTreeDocsArtifactId",
    "fileTreeDocsArtifactId",
    "llmFileTreeDocsId",
    "fileTreeDocsId",
  ],
  refinedRules: [
    "llmRefinedRulesArtifactId",
    "refinedRulesArtifactId",
    "llmRulesArtifactId",
    "rulesArtifactId",
  ],
};

const LLM_NESTED_ARTIFACT_FIELDS = {
  scenarioSpecs: [
    "scenarioSpecsArtifactId",
    "scenarioSpecsId",
    "scenarioSpecs",
    "scenario_specs_artifact_id",
  ],
  subsystemSummaries: [
    "subsystemSummariesArtifactId",
    "subsystemSummariesId",
    "subsystemSummaries",
    "subsystem_summaries_artifact_id",
  ],
  apiDocs: ["apiDocsArtifactId", "apiDocsId", "apiDocs", "api_docs_artifact_id"],
  fileTreeDocs: [
    "fileTreeDocsArtifactId",
    "fileTreeDocsId",
    "fileTreeDocs",
    "file_tree_docs_artifact_id",
  ],
  refinedRules: [
    "refinedRulesArtifactId",
    "refinedRulesId",
    "refinedRules",
    "refined_rules_artifact_id",
    "rulesArtifactId",
  ],
};

const CLASS_DIAGRAM_ARTIFACT_FIELDS = [
  "classDiagramArtifactId",
  "classMapArtifactId",
  "classDiagramId",
];

function createEmptyLlmResultMap() {
  return LLM_RESULT_KEYS.reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {});
}

function createEmptyLlmArtifactIdMap() {
  return LLM_RESULT_KEYS.reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {});
}

const EMPTY_LLM_RESULTS = createEmptyLlmResultMap();

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (typeof value === "bigint") {
      return String(value);
    }
  }

  return null;
}

function normalizeArtifactToken(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function getArtifactList(progressArtifacts, progress) {
  if (Array.isArray(progressArtifacts)) {
    return progressArtifacts;
  }

  if (Array.isArray(progressArtifacts?.items)) {
    return progressArtifacts.items;
  }

  if (Array.isArray(progressArtifacts?.artifacts)) {
    return progressArtifacts.artifacts;
  }

  if (Array.isArray(progress?.artifactList)) {
    return progress.artifactList;
  }

  return [];
}

function artifactIdFromRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  return firstNonEmptyString(
    record.artifactId,
    record.id,
    record.value,
    record.artifact?.artifactId,
    record.artifact?.id,
    record.artifact?.value
  );
}

function findArtifactIdFromList(records, tokenCandidates) {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const normalizedCandidates = new Set(
    tokenCandidates.map((token) => normalizeArtifactToken(token))
  );

  for (const record of records) {
    const labels = [
      record?.artifactType,
      record?.type,
      record?.kind,
      record?.name,
      record?.key,
      record?.stage,
      record?.artifact?.artifactType,
      record?.artifact?.type,
      record?.artifact?.kind,
      record?.artifact?.name,
      record?.artifact?.key,
      record?.artifact?.stage,
    ];

    const matched = labels.some((label) =>
      normalizedCandidates.has(normalizeArtifactToken(label))
    );

    if (!matched) {
      continue;
    }

    const artifactId = artifactIdFromRecord(record);
    if (artifactId) {
      return artifactId;
    }
  }

  return null;
}

function normalizeArtifactContent(content) {
  if (typeof content !== "string") {
    return content ?? null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return content;
  }
}

function resolveClassDiagramArtifactId(progress) {
  const artifacts = progress?.artifacts;
  const artifactList = getArtifactList(artifacts, progress);

  return (
    firstNonEmptyString(
      ...CLASS_DIAGRAM_ARTIFACT_FIELDS.map((field) => artifacts?.[field]),
      artifacts?.classDiagram?.artifactId,
      artifacts?.classDiagram?.id,
      artifacts?.artifactIds?.CLASS_DIAGRAM,
      artifacts?.artifactIds?.classDiagram,
      progress?.artifactIds?.CLASS_DIAGRAM,
      progress?.artifactIds?.classDiagram,
      progress?.classDiagramArtifactId
    ) || findArtifactIdFromList(artifactList, ["CLASS_DIAGRAM", "CLASS_MAP"])
  );
}

function resolveLlmArtifactMap(progress) {
  const artifacts = progress?.artifacts;
  const llmArtifacts = artifacts?.llm ?? progress?.llmArtifacts ?? null;
  const artifactList = getArtifactList(artifacts, progress);
  const artifactIds = artifacts?.artifactIds ?? progress?.artifactIds ?? null;
  const resolved = createEmptyLlmArtifactIdMap();

  LLM_RESULT_KEYS.forEach((key) => {
    const directId = firstNonEmptyString(
      ...LLM_DIRECT_ARTIFACT_FIELDS[key].map((field) => artifacts?.[field]),
      ...LLM_NESTED_ARTIFACT_FIELDS[key].map((field) => llmArtifacts?.[field])
    );

    const tokenBasedId = firstNonEmptyString(
      ...(LLM_ARTIFACT_TYPE_TOKEN[key] ?? []).map((token) => artifactIds?.[token])
    );

    resolved[key] =
      directId ??
      tokenBasedId ??
      findArtifactIdFromList(artifactList, LLM_ARTIFACT_TYPE_TOKEN[key] ?? []);
  });

  return resolved;
}

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
    llm: createEmptyLlmArtifactIdMap(),
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
      llm: createEmptyLlmArtifactIdMap(),
    };

    setClassDiagram(null);
    setClassDiagramError(null);
    setLlmResults(createEmptyLlmResultMap());
    setLlmError(null);

    const loadArtifactContent = async (artifactId) => {
      const response = await getArtifactJson(artifactId);
      const artifact = unwrapApiResponse(response);
      return normalizeArtifactContent(artifact?.content ?? null);
    };

    const loadClassDiagramIfReady = async (nextProgress) => {
      const artifactId = resolveClassDiagramArtifactId(nextProgress);

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
      const artifactMap = resolveLlmArtifactMap(nextProgress);

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
        ...createEmptyLlmArtifactIdMap(),
      };

      setLlmResults(createEmptyLlmResultMap());

      const artifactMap = resolveLlmArtifactMap(latestProgress);

      const entries = Object.entries(artifactMap).filter(([, id]) => id);

      if (entries.length === 0) return;

      setLlmLoading(true);
      setLlmError(null);

      const settled = await Promise.allSettled(
        entries.map(async ([key, artifactId]) => {
          const artifactResponse = await getArtifactJson(artifactId);
          const artifact = unwrapApiResponse(artifactResponse);
          return [key, artifactId, normalizeArtifactContent(artifact?.content)];
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

  const moveToGithubStats = () => {
    if (!runId) {
      alert("runId가 없어 GitHub 통계를 조회할 수 없습니다.");
      return;
    }

    const query = new URLSearchParams();
    query.set("runId", runId);

    if (repo) {
      query.set("repo", repo);
    }

    navigate(`/github-stats?${query.toString()}`, {
      state: {
        runId,
        repo,
        run,
      },
    });
  };

  return (
    <div className="relative z-10">
      <div className="w-[90vw] mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={18} />
            Home
          </button>

          {runId && (
            <button
              type="button"
              onClick={moveToGithubStats}
              className="flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/20"
            >
              <BarChart3 size={18} />
              GitHub 통계량 보기
            </button>
          )}
        </div>

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

        {/* 4-1. 패키지별 클래스/메서드 문서
        <PackageClassDocsSection
          fileTreeDocs={llmResults.fileTreeDocs}
          loading={llmLoading && !llmResults.fileTreeDocs}
          error={llmError}
        /> */}

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
