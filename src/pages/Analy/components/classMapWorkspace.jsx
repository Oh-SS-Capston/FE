import { useMemo, useState } from "react";
import { Layers3, Network, Loader2 } from "lucide-react";
import { buildClassMap, getArtifactJson } from "../../../features/classmap/api/classMapApi";
import ClassDiagramSection from "./ClassDiagramSection";

const OVERVIEW_KEY = "OVERVIEW";

function sortSubsystems(subsystems) {
  return [...subsystems].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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

      const buildResult = await buildClassMap({
        runId,
        scope: "SUBSYSTEM",
        subsystemId: key,
        maxNodes: 40,
        maxEdges: 120,
        startHereTopN: 5,
      });

      const artifactId = buildResult?.classDiagramArtifactId;
      if (!artifactId) {
        throw new Error("subsystem classDiagramArtifactId가 응답에 없습니다.");
      }

      const artifact = await getArtifactJson(artifactId);
      const diagram = artifact?.content;
      if (!diagram) {
        throw new Error("subsystem class diagram content가 없습니다.");
      }

      setDiagramByKey((prev) => ({
        ...prev,
        [key]: diagram,
      }));
    } catch (error) {
      setDetailError(error?.message ?? "군집 상세 다이어그램을 불러오지 못했습니다.");
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
