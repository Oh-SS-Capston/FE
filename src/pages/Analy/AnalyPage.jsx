import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BarChart3, BookOpen, FolderTree, Network } from "lucide-react";

import RepoInfoSection from "./components/RepoInfoSection";
import ClassDiagramSection from "./components/ClassDiagramSection";
import DirectoryStructureSection from "./components/DirectoryStructureSection";
import AnalyzeProgressPanel from "./components/AnalyzeProgressPanel";
import LlmResultSection from "./components/LlmResultSection";
import LicenseAnalysisSection from "../../features/license/components/LicenseAnalysisSection";
import { useLicenseAnalysisArtifact } from "../../features/license/hooks/useLicenseAnalysisArtifact";
import { buildLicenseAnalysisPath } from "../../features/license/lib/licenseNavigation";

import InsufficientTokenModal from "../../features/token/components/InsufficientTokenModal";
import ReanalysisConfirmModal from "../../features/token/components/ReanalysisConfirmModal";
import { TOKEN_COST } from "../../features/token/constants/tokenPolicy";
import {
  formatUserErrorMessage,
  formatUserMessage,
} from "../../shared/lib/userErrorMessage";
import Panel from "../../shared/components/ui/Panel";
import { TabButton, TabsList } from "../../shared/components/ui/Tabs";

import {
  createRepoRun,
  getArtifactJson,
  getRunProgress,
} from "../../features/run/api/runApi";

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

const RESULT_TAB = {
  DOCUMENTS: "DOCUMENTS",
  CODE_EXPLORER: "CODE_EXPLORER",
  CLASS_STRUCTURE: "CLASS_STRUCTURE",
};

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

function resolveAnalysisCommitSha(run, progress) {
  return firstNonEmptyString(
    run?.commitSha,
    run?.resolvedCommitSha,
    run?.resolvedSha,
    run?.snapshotCommitSha,
    run?.headCommitSha,
    run?.headSha,
    run?.commitId,
    run?.commit?.sha,
    run?.resolvedCommit?.sha,
    run?.snapshot?.commitSha,
    progress?.commitSha,
    progress?.resolvedCommitSha,
    progress?.resolvedSha,
    progress?.snapshotCommitSha,
    progress?.headCommitSha,
    progress?.headSha,
    progress?.commitId,
    progress?.commit?.sha,
    progress?.resolvedCommit?.sha,
    progress?.snapshot?.commitSha,
    progress?.run?.commitSha,
    progress?.artifacts?.commitSha
  );
}

function resolveAnalysisRef(run, progress) {
  return firstNonEmptyString(
    run?.resolvedRef,
    run?.requestedRef,
    run?.ref,
    run?.branch,
    progress?.resolvedRef,
    progress?.requestedRef,
    progress?.ref,
    progress?.branch,
    progress?.run?.resolvedRef
  );
}

function resolveAnalyzedAt(run, progress) {
  return firstNonEmptyString(
    progress?.analyzedAt,
    progress?.analysisCompletedAt,
    progress?.completedAt,
    progress?.finishedAt,
    run?.analyzedAt,
    run?.analysisCompletedAt,
    run?.completedAt,
    run?.finishedAt,
    progress?.updatedAt,
    run?.updatedAt,
    progress?.createdAt,
    run?.createdAt
  );
}

function encodeGithubPath(path) {
  return String(path ?? "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildGithubContentsUrl(owner, name, path, commitSha) {
  const encodedPath = encodeGithubPath(path);
  const pathSuffix = encodedPath ? `/${encodedPath}` : "";
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    name
  )}/contents${pathSuffix}?ref=${encodeURIComponent(commitSha)}`;
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

function mapGithubContentItem(item) {
  return {
    name: item.name,
    path: item.path,
    type: item.type,
    children: item.type === "dir" ? [] : undefined,
    loaded: false,
  };
}

function updateTreeNodeChildren(nodes, targetPath, children) {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return {
        ...node,
        children,
        loaded: true,
      };
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      return {
        ...node,
        children: updateTreeNodeChildren(node.children, targetPath, children),
      };
    }

    return node;
  });
}

function findTreeNode(nodes, targetPath) {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      const found = findTreeNode(node.children, targetPath);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

function isLlmAnalysisCompleted(progress) {
  if (!progress) {
    return false;
  }

  if (progress.status !== "SUCCESS") {
    return false;
  }

  if (progress.stage !== "DONE") {
    return false;
  }

  const progressValue = Number(progress.progress);

  if (!Number.isFinite(progressValue) || progressValue < 100) {
    return false;
  }

  const llmStep = Array.isArray(progress.steps)
    ? progress.steps.find((step) => step?.stage === "LLM")
    : null;

  if (llmStep?.status === "SUCCESS") {
    return true;
  }

  const llmArtifactMap = resolveLlmArtifactMap(progress);
  return LLM_RESULT_KEYS.every((key) => Boolean(llmArtifactMap[key]));
}

function isBrowserNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function getBrowserNotificationPermission() {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
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
  const completionNoticeRunRef = useRef(null);

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
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [completionNoticeVisible, setCompletionNoticeVisible] = useState(false);
  const [browserNoticePermission, setBrowserNoticePermission] = useState(
    getBrowserNotificationPermission()
  );
  const [activeResultTab, setActiveResultTab] = useState(RESULT_TAB.DOCUMENTS);

  useEffect(() => {
    setBrowserNoticePermission(getBrowserNotificationPermission());
  }, []);

  const [reanalysisConfirmOpen, setReanalysisConfirmOpen] = useState(false);
  const [insufficientTokenOpen, setInsufficientTokenOpen] = useState(false);
  const {
    artifactId: licenseAnalysisArtifactId,
    analysis: licenseAnalysis,
    loading: licenseAnalysisLoading,
    error: licenseAnalysisError,
  } = useLicenseAnalysisArtifact(progress, runId);

  const analysisCommitSha = useMemo(
    () => resolveAnalysisCommitSha(run, progress),
    [run, progress]
  );
  const analysisRef = useMemo(() => resolveAnalysisRef(run, progress), [run, progress]);
  const analyzedAt = useMemo(() => resolveAnalyzedAt(run, progress), [run, progress]);
  const analysisStatus = progress?.status ?? run?.status ?? null;

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
        setRepoInfoError(formatUserErrorMessage(e, String(e)));
      } finally {
        setRepoInfoLoading(false);
      }
    })();
  }, [repo]);

  useEffect(() => {
    if (!repo) return;

    setTree([]);
    setExpanded({});
    setTreeError(null);

    if (!analysisCommitSha) {
      const terminal = analysisStatus === "SUCCESS" || analysisStatus === "FAILED";
      setTreeLoading(Boolean(runId) && !terminal);
      setTreeError(
        terminal
          ? "분석 결과에서 Commit SHA를 확인하지 못해 디렉토리를 조회하지 않았습니다."
          : null
      );
      return;
    }

    const [owner, name] = repo.split("/");
    let cancelled = false;

    (async () => {
      try {
        setTreeLoading(true);
        const res = await fetch(
          buildGithubContentsUrl(owner, name, "", analysisCommitSha)
        );

        if (!res.ok) {
          throw new Error(`GitHub contents error: ${res.status}`);
        }

        const items = await res.json();

        if (!cancelled) {
          setTree(Array.isArray(items) ? items.map(mapGithubContentItem) : []);
        }
      } catch (e) {
        if (!cancelled) {
          setTreeError(formatUserErrorMessage(e, String(e)));
        }
      } finally {
        if (!cancelled) {
          setTreeLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisCommitSha, analysisStatus, repo, runId]);

  const requestBrowserNotificationPermission = async () => {
    if (!isBrowserNotificationSupported()) {
      return;
    }

    if (Notification.permission === "granted") {
      setBrowserNoticePermission("granted");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserNoticePermission(permission);
    } catch {
      setBrowserNoticePermission(getBrowserNotificationPermission());
    }
  };

  const notifyBrowserIfBackground = (nextRunId) => {
    if (!isBrowserNotificationSupported()) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    if (!document.hidden) {
      return;
    }

    const notification = new Notification("Oh!SS 분석 완료", {
      body: "LLM 결과 생성까지 100% 완료되었습니다.",
      icon: "/favicon.ico",
      lang: "ko-KR",
      tag: `ossdoc-analysis-complete-${nextRunId}`,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  useEffect(() => {
    if (!runId) return;

    let cancelled = false;
    let timerId = null;

    loadedArtifactIdsRef.current = {
      classDiagram: null,
      llm: createEmptyLlmArtifactIdMap(),
    };
    completionNoticeRunRef.current = null;
    setCompletionNoticeVisible(false);

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
          setClassDiagramError(formatUserMessage(classMapFailed.message));
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
            formatUserErrorMessage(
              e,
              "클래스 다이어그램 산출물을 불러오지 못했습니다."
            )
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
          setLlmError(formatUserErrorMessage(e, "LLM 결과 산출물을 불러오지 못했습니다."));
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

        if (
          isLlmAnalysisCompleted(nextProgress) &&
          completionNoticeRunRef.current !== runId
        ) {
          completionNoticeRunRef.current = runId;
          setCompletionNoticeVisible(true);
          notifyBrowserIfBackground(runId);
        }

        /*
         * 동작 변경
         * 전체 파이프라인 SUCCESS를 기다리지 않고,
         * artifact id가 생기는 즉시 결과를 조회합니다.
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

        setProgressError(formatUserErrorMessage(e, "분석 진행 상태를 불러오지 못했습니다."));
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
      setLlmError(formatUserErrorMessage(e, "LLM 결과를 새로고침하지 못했습니다."));
    } finally {
      setLlmLoading(false);
    }
  };

  const executeForceRebuild = async () => {
    const repoUrlForRequest =
      location.state?.repoUrl ||
      run?.repoUrl ||
      (repo ? `https://github.com/${repo}` : null);

    if (!repoUrlForRequest) {
      setLlmError("재생성 요청에 필요한 레포지토리 URL을 찾지 못했습니다.");
      return;
    }

    const refForRequest =
      run?.resolvedRef || run?.ref || run?.requestedRef || run?.branch || null;

    /*
     * 재생성은 원래 run과 같은 LLM 제공자로 돌립니다.
     * 어느 쪽에서도 찾지 못하면 보내지 않고 서버 기본값을 따릅니다.
     */
    const providerForRequest =
      run?.llmProvider || location.state?.llmProvider || null;

    try {
      setRebuildLoading(true);
      setLlmError(null);

      const nextRun = await createRepoRun({
        repoUrl: repoUrlForRequest,
        ref: refForRequest,
        forceRebuild: true,
        llmProvider: providerForRequest,
      });

      const nextRepo =
        repo ||
        firstNonEmptyString(run?.repoFullName, run?.repoName) ||
        null;

      const repoQuery = nextRepo ? `&repo=${encodeURIComponent(nextRepo)}` : "";

      navigate(
        `/analyze?runId=${encodeURIComponent(nextRun.runId)}${repoQuery}`,
        {
          state: {
            repo: nextRepo,
            repoUrl: repoUrlForRequest,
            run: nextRun,
            llmProvider: providerForRequest,
          },
        }
      );
    } catch (e) {
      if (e?.code === "TOKEN402_1") {
        setInsufficientTokenOpen(true);
        setLlmError(null);
        return;
      }

      setLlmError(formatUserErrorMessage(e, "재생성 요청에 실패했습니다."));
    } finally {
      setRebuildLoading(false);
    }
  };

  const handleForceRebuild = () => {
    setReanalysisConfirmOpen(true);
  };

  const toggleFolder = async (path) => {
    if (!repo || !analysisCommitSha) return;

    const [owner, name] = repo.split("/");
    const isOpen = !!expanded[path];

    setExpanded((prev) => ({
      ...prev,
      [path]: !isOpen,
    }));

    if (isOpen) {
      return;
    }

    const targetNode = findTreeNode(tree, path);

    if (targetNode?.loaded) {
      return;
    }

    try {
      const res = await fetch(
        buildGithubContentsUrl(owner, name, path, analysisCommitSha)
      );

      if (!res.ok) {
        throw new Error(`GitHub contents error: ${res.status}`);
      }

      const children = await res.json();
      const mappedChildren = Array.isArray(children)
        ? children.map(mapGithubContentItem)
        : [];

      setTree((prev) => updateTreeNodeChildren(prev, path, mappedChildren));
    } catch {
      /*
       * 디렉터리 펼치기 실패는 전체 분석 실패로 처리하지 않습니다.
       * GitHub contents API rate limit이나 네트워크 오류가 있어도
       * 분석 결과 페이지 전체가 깨지지 않게 합니다.
       */
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
            홈으로 돌아가기
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

  const moveToLicenseAnalysis = () => {
    if (!runId) {
      alert("runId가 없어 라이선스 상세 분석을 조회할 수 없습니다.");
      return;
    }

    navigate(buildLicenseAnalysisPath({ runId, repo }), {
      state: {
        runId,
        repo,
      },
    });
  };

  const resultTabs = [
    {
      key: RESULT_TAB.DOCUMENTS,
      label: "분석 문서",
      description: "시나리오, 서브시스템, API와 규칙",
      icon: BookOpen,
    },
    {
      key: RESULT_TAB.CODE_EXPLORER,
      label: "코드 탐색",
      description: "Commit 고정 디렉토리와 파일 설명",
      icon: FolderTree,
    },
    {
      key: RESULT_TAB.CLASS_STRUCTURE,
      label: "클래스 구조",
      description: "클래스 관계와 핵심 진입점",
      icon: Network,
    },
  ];

  return (
    <div className="relative z-10">
      <div className="w-[90vw] mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={18} />
            Home
          </button>

          {runId && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {browserNoticePermission !== "granted" &&
                browserNoticePermission !== "unsupported" && (
                  <button
                    type="button"
                    onClick={requestBrowserNotificationPermission}
                    translate="no"
                    className="notranslate rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:border-yellow-300/50 hover:bg-yellow-300/20"
                  >
                    분석 완료 알림 허용
                  </button>
                )}

              <button
                type="button"
                onClick={moveToGithubStats}
                className="flex w-fit items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]"
              >
                <BarChart3 size={18} />
                GitHub 통계 보기
              </button>
            </div>
          )}
        </div>

        <RepoInfoSection
          repo={repo}
          info={repoInfo}
          loading={repoInfoLoading}
          error={repoInfoError}
          commitSha={analysisCommitSha}
          analysisRef={analysisRef}
          analyzedAt={analyzedAt}
          analysisStatus={analysisStatus}
          cacheHit={Boolean(run?.cacheHit)}
        />

        {progressError && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-200">
            {progressError}
          </div>
        )}

        <AnalyzeProgressPanel progress={progress} />

        {/* 대표 라이선스 분석 */}
        <LicenseAnalysisSection
          artifactId={licenseAnalysisArtifactId}
          analysis={licenseAnalysis}
          loading={licenseAnalysisLoading}
          error={licenseAnalysisError}
          actions={
            runId ? (
              <button
                type="button"
                onClick={moveToLicenseAnalysis}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
              >
                상세 보기
                <ArrowUpRight size={16} />
              </button>
            ) : null
          }
        />

        <Panel padding="none" className="overflow-hidden">
          <div className="border-b border-[var(--border)] p-3">
            <TabsList
              role="tablist"
              aria-label="분석 결과 보기"
              className="md:grid-cols-3"
            >
              {resultTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeResultTab === tab.key;

                return (
                  <TabButton
                    key={tab.key}
                    role="tab"
                    aria-selected={active}
                    active={active}
                    onClick={() => setActiveResultTab(tab.key)}
                    className="flex items-center gap-3"
                  >
                    <Icon size={19} className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-semibold">{tab.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                        {tab.description}
                      </span>
                    </span>
                  </TabButton>
                );
              })}
            </TabsList>
          </div>

          <div className="p-4 sm:p-6">
            {activeResultTab === RESULT_TAB.DOCUMENTS && (
              <LlmResultSection
                results={llmResults}
                loading={llmLoading}
                error={llmError}
                onRefresh={refreshLlmResults}
                onRegenerate={handleForceRebuild}
                regenerating={rebuildLoading}
                showCachedNotice={Boolean(run?.cacheHit)}
                cachedAnalyzedAt={analyzedAt}
                showFileTreeTab={false}
              />
            )}

            {activeResultTab === RESULT_TAB.CODE_EXPLORER && (
              <DirectoryStructureSection
                tree={tree}
                loading={treeLoading}
                error={treeError}
                expanded={expanded}
                onToggle={toggleFolder}
                commitSha={analysisCommitSha}
                fileTreeDocs={llmResults.fileTreeDocs}
                docsLoading={llmLoading && !llmResults.fileTreeDocs}
                docsError={llmError}
              />
            )}

            {activeResultTab === RESULT_TAB.CLASS_STRUCTURE && (
              <ClassDiagramSection
                classDiagram={classDiagram}
                loading={classDiagramLoading}
                error={
                  classDiagramError ||
                  (classMapFailed?.message
                    ? formatUserMessage(classMapFailed.message)
                    : null)
                }
              />
            )}
          </div>
        </Panel>
      </div>
      <ReanalysisConfirmModal
        open={reanalysisConfirmOpen}
        loading={rebuildLoading}
        onClose={() => {
          if (!rebuildLoading) {
            setReanalysisConfirmOpen(false);
          }
        }}
        onConfirm={async () => {
          await executeForceRebuild();
          setReanalysisConfirmOpen(false);
        }}
      />
      <InsufficientTokenModal
        open={insufficientTokenOpen}
        requiredTokens={TOKEN_COST.REANALYSIS}
        title="재분석에 필요한 토큰이 부족합니다."
        description="재분석 요청에는 500토큰이 필요합니다. 토큰을 충전한 뒤 다시 요청해주세요."
        onClose={() => setInsufficientTokenOpen(false)}
        onCharge={() => {
          setInsufficientTokenOpen(false);
          navigate("/mypage");
        }}
      />

      {completionNoticeVisible && (
        <div
          role="alert"
          aria-live="assertive"
          translate="no"
          className="notranslate fixed bottom-6 right-6 z-[120] w-[min(420px,calc(100vw-2rem))] rounded-xl border border-cyan-300/30 bg-[var(--surface)] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-cyan-100">분석 완료</p>
              <p className="mt-1 text-sm text-slate-200">
                LLM 결과 생성까지 100% 완료되었습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCompletionNoticeVisible(false)}
              className="shrink-0 rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

