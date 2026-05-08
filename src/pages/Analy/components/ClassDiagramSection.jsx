import { Box, GitBranch, Loader2 } from "lucide-react";

function formatScore(score) {
  if (score === null || score === undefined) {
    return "-";
  }

  if (typeof score === "number") {
    return score.toFixed(1);
  }

  return String(score);
}

function badgeClassName(badge) {
  switch (badge) {
    case "public_api":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
    case "start_here":
      return "border-purple-400/30 bg-purple-400/10 text-purple-200";
    case "config":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "extension_point":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-200";
    case "input_model":
    case "output_model":
      return "border-blue-400/30 bg-blue-400/10 text-blue-200";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

function edgeClassName(edgeType) {
  switch (edgeType) {
    case "EXTENDS":
      return "text-purple-300 border-purple-400/20 bg-purple-400/10";
    case "IMPLEMENTS":
      return "text-cyan-300 border-cyan-400/20 bg-cyan-400/10";
    case "PARAM":
      return "text-emerald-300 border-emerald-400/20 bg-emerald-400/10";
    case "RETURNS":
      return "text-yellow-300 border-yellow-400/20 bg-yellow-400/10";
    default:
      return "text-gray-300 border-white/10 bg-white/5";
  }
}

export default function ClassDiagramSection({
  classDiagram,
  loading = false,
  error = null,
}) {
  const nodes = classDiagram?.nodes ?? [];
  const edges = classDiagram?.edges ?? [];
  const nodeById = new Map(nodes.map((node) => [node.symbolId, node]));

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
        }}
      />

      <div className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-4">
          <Box size={22} className="text-cyan-400" />
          Class Diagram
        </h3>

        {loading ? (
          <div className="min-h-[260px] rounded-xl border border-white/10 bg-[#050508]/80 flex flex-col items-center justify-center p-6">
            <Loader2 size={28} className="animate-spin text-cyan-400 mb-3" />
            <p className="text-gray-500 text-sm">
              클래스다이어그램을 생성하고 불러오는 중입니다.
            </p>
          </div>
        ) : error ? (
          <div className="min-h-[220px] rounded-xl border border-red-500/20 bg-red-950/10 flex items-center justify-center p-6">
            <p className="text-red-300 text-sm text-center leading-relaxed">
              클래스다이어그램을 불러오지 못했습니다.
              <br />
              <span className="text-red-400/70">{error}</span>
            </p>
          </div>
        ) : !classDiagram ? (
          <div className="min-h-[220px] rounded-xl border border-white/10 bg-[#050508]/80 flex items-center justify-center p-6">
            <p className="text-gray-500 text-sm text-center leading-relaxed">
              아직 다이어그램이 없습니다.
              <br />
              <span className="text-gray-600">
                분석 완료 후 class_diagram.json이 표시됩니다.
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-500">Nodes</p>
                <p className="text-2xl font-bold text-cyan-200">
                  {nodes.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-500">Edges</p>
                <p className="text-2xl font-bold text-purple-200">
                  {edges.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-500">Total Types</p>
                <p className="text-2xl font-bold text-gray-200">
                  {classDiagram?.summary?.totalTypeCount ?? "-"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-500">Candidate Types</p>
                <p className="text-2xl font-bold text-gray-200">
                  {classDiagram?.summary?.candidateTypeCount ?? "-"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#050508]/80 p-4 overflow-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-3 gap-4">
                  {nodes.map((node) => (
                    <div
                      key={node.symbolId}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-950/10 p-4 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-100 truncate">
                            {node.label}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {node.packageName || node.qualifiedName}
                          </p>
                        </div>

                        <span className="text-xs text-cyan-200 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-2 py-1">
                          {formatScore(node.score)}
                        </span>
                      </div>

                      {node.badges?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {node.badges.map((badge) => (
                            <span
                              key={badge}
                              className={`text-[11px] border rounded-full px-2 py-0.5 ${badgeClassName(
                                badge
                              )}`}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#050508]/80 p-4">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch size={18} className="text-purple-300" />
                <h4 className="font-bold text-gray-200">Relationships</h4>
              </div>

              {edges.length === 0 ? (
                <p className="text-sm text-gray-500">
                  표시할 관계가 없습니다.
                </p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                  {edges.map((edge, index) => {
                    const source = nodeById.get(edge.sourceSymbolId);
                    const target = nodeById.get(edge.targetSymbolId);

                    return (
                      <div
                        key={`${edge.sourceSymbolId}-${edge.targetSymbolId}-${edge.edgeType}-${index}`}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-200">
                            {source?.label ?? edge.sourceSymbolId}
                          </span>

                          <span
                            className={`text-xs border rounded-full px-2 py-0.5 ${edgeClassName(
                              edge.edgeType
                            )}`}
                          >
                            {edge.label ?? edge.edgeType}
                          </span>

                          <span className="font-semibold text-gray-200">
                            {target?.label ?? edge.targetSymbolId}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>evidence: {edge.evidenceCount ?? 0}</span>
                          <span>
                            confidence:{" "}
                            {edge.confidence === null ||
                            edge.confidence === undefined
                              ? "-"
                              : edge.confidence}
                          </span>
                          <span>resolution: {edge.resolution ?? "-"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}