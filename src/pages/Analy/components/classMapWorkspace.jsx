import { useMemo, useState } from "react";
import { Layers3, Network, Loader2 } from "lucide-react";
import {
  getArtifactJson,
  getRunProgress,
} from "../../../features/run/api/runApi";
import { formatUserErrorMessage } from "../../../shared/lib/userErrorMessage";
import ClassDiagramSection from "./ClassDiagramSection";

const OVERVIEW_KEY = "OVERVIEW";

function sortSubsystems(subsystems) {
  return [...subsystems].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

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

function parseMaybeJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
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

function extractArtifactContent(payload) {
  const parsed = parseMaybeJson(payload);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed.content != null) {
    return parseMaybeJson(parsed.content);
  }

  if (parsed.result != null) {
    return parseMaybeJson(parsed.result);
  }

  return parsed;
}

function resolveSubsystemClassDiagramArtifactId(progress, subsystemId) {
  const artifacts = progress?.artifacts;
  const key = String(subsystemId);

  const direct = firstNonEmptyString(
    artifacts?.subsystemClassDiagramArtifactIds?.[key],
    artifacts?.subsystemClassMapArtifactIds?.[key],
    artifacts?.classDiagramArtifactsBySubsystem?.[key],
    artifacts?.subsystemArtifacts?.[key]?.classDiagramArtifactId,
    artifacts?.subsystems?.[key]?.classDiagramArtifactId,
    progress?.subsystemArtifacts?.[key]?.classDiagramArtifactId
  );

  if (direct) {
    return direct;
  }

  const list = getArtifactList(artifacts, progress);
  const typeTokens = new Set([
    "CLASSDIAGRAM",
    "CLASSMAP",
    "SUBSYSTEMCLASSDIAGRAM",
    "SUBSYSTEMCLASSMAP",
  ]);

  for (const record of list) {
    const typeLabel = firstNonEmptyString(
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
      record?.artifact?.stage
    );

    if (!typeLabel || !typeTokens.has(normalizeArtifactToken(typeLabel))) {
      continue;
    }

    const recordSubsystemId = firstNonEmptyString(
      record?.subsystemId,
      record?.scopeId,
      record?.clusterId,
      record?.groupId,
      record?.artifact?.subsystemId,
      record?.artifact?.scopeId,
      record?.artifact?.clusterId,
      record?.artifact?.groupId
    );

    if (recordSubsystemId && String(recordSubsystemId) === key) {
      const artifactId = artifactIdFromRecord(record);
      if (artifactId) {
        return artifactId;
      }
    }
  }

  return null;
}

export default function ClassMapWorkspace({
  runId,
  overviewDiagram,
  subsystems = [],
  overviewLoading = false,
  overviewError = null,
}) {
  const orderedSubsystems = useMemo(() => sortSubsystems(subsystems), [subsystems]);
  const [selectedKey, setSelectedKey] = useState(OVERVIEW_KEY);
  const [diagramByKey, setDiagramByKey] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [detailError, setDetailError] = useState(null);

  const selectedSubsystem =
    selectedKey === OVERVIEW_KEY
      ? null
      : orderedSubsystems.find((item) => item.subsystemId === selectedKey) ?? null;

  const selectedDiagram =
    selectedKey === OVERVIEW_KEY
      ? overviewDiagram
      : diagramByKey[selectedKey] ?? null;

  const selectedLoading =
    selectedKey === OVERVIEW_KEY ? overviewLoading : loadingKey === selectedKey;

  const selectedError =
    selectedKey === OVERVIEW_KEY ? overviewError : detailError;

  const handleSelectOverview = () => {
    setSelectedKey(OVERVIEW_KEY);
    setDetailError(null);
  };

  const handleSelectSubsystem = async (subsystem) => {
    const key = subsystem.subsystemId;
    setSelectedKey(key);
    setDetailError(null);

    if (diagramByKey[key]) {
      return;
    }

    try {
      setLoadingKey(key);
      if (!runId) {
        throw new Error("runId가 없어 군집 상세 다이어그램을 조회할 수 없습니다.");
      }

      const progress = await getRunProgress(runId);
      const artifactId = resolveSubsystemClassDiagramArtifactId(progress, key);

      if (!artifactId) {
        throw new Error("선택한 군집의 classDiagram artifactId가 progress 응답에 없습니다.");
      }

      const artifact = await getArtifactJson(artifactId);
      const diagram = extractArtifactContent(artifact);

      if (!diagram) {
        throw new Error("subsystem class diagram content가 없습니다.");
      }

      setDiagramByKey((prev) => ({
        ...prev,
        [key]: diagram,
      }));
    } catch (error) {
      setDetailError(formatUserErrorMessage(error, "군집 상세 다이어그램을 불러오지 못했습니다."));
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 p-5">
        <div className="flex items-center gap-2">
          <Network size={20} className="text-cyan-300" />
          <h3 className="text-lg font-bold text-gray-100">Diagram Views</h3>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          전체 구조는 Overview에서 보고, 각 군집을 눌러 기능별 세부 구조로 내려갈 수 있습니다.
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={handleSelectOverview}
            className={`shrink-0 rounded-xl border px-4 py-3 text-left transition ${
              selectedKey === OVERVIEW_KEY
                ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Network size={16} />
              <span className="font-semibold">Overview</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">전체 핵심 구조</p>
          </button>

          {orderedSubsystems.map((subsystem, index) => (
            <button
              key={subsystem.subsystemId}
              type="button"
              onClick={() => handleSelectSubsystem(subsystem)}
              className={`min-w-[210px] shrink-0 rounded-xl border px-4 py-3 text-left transition ${
                selectedKey === subsystem.subsystemId
                  ? "border-purple-300/60 bg-purple-400/10 text-purple-100"
                  : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers3 size={16} />
                  <span className="font-semibold">{subsystem.name || `Subsystem ${index + 1}`}</span>
                </div>
                {loadingKey === subsystem.subsystemId && (
                  <Loader2 size={14} className="animate-spin" />
                )}
              </div>

              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span>{subsystem.memberSymbolIds?.length ?? 0} types</span>
                <span>score {Number(subsystem.score ?? 0).toFixed(1)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSubsystem && (
        <div className="rounded-2xl border border-purple-400/15 bg-purple-950/10 p-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="font-semibold text-purple-100">{selectedSubsystem.name}</span>
            <span className="text-gray-400">members {selectedSubsystem.memberSymbolIds?.length ?? 0}</span>
            <span className="text-gray-400">entries {selectedSubsystem.entrySymbolIds?.length ?? 0}</span>
            <span className="text-gray-400">cores {selectedSubsystem.coreSymbolIds?.length ?? 0}</span>
          </div>

          {selectedSubsystem.packageRoots?.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              package roots: {selectedSubsystem.packageRoots.join(", ")}
            </p>
          )}
        </div>
      )}

      <ClassDiagramSection
        classDiagram={selectedDiagram}
        loading={selectedLoading}
        error={selectedError}
      />
    </section>
  );
}
