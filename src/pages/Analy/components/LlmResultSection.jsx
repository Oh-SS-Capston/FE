import { useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  Boxes,
  ChevronDown,
  FileCode2,
  FolderOpen,
  ListChecks,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

const TAB = {
  SCENARIO: "SCENARIO",
  SUBSYSTEM: "SUBSYSTEM",
  API: "API",
  FILE_TREE: "FILE_TREE",
};

function countOf(value) {
  return Array.isArray(value) ? value.length : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasAnyLlmResult(results) {
  if (!results) {
    return false;
  }

  return Boolean(
    results.scenarioSpecs ||
      results.subsystemSummaries ||
      results.apiDocs ||
      results.fileTreeDocs
  );
}

function formatLayer(layer) {
  if (!layer) {
    return "-";
  }

  switch (layer) {
    case "application":
      return "Application";
    case "domain":
      return "Domain";
    case "infrastructure":
      return "Infrastructure";
    default:
      return layer;
  }
}

function FileTreePanel({ data }) {
  const directories = safeArray(data?.directories);
  const [expanded, setExpanded] = useState({});

  if (directories.length === 0) {
    return <EmptyText text="파일 트리 문서 결과가 없습니다." />;
  }

  const toggle = (path) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <div className="space-y-3">
      {directories.map((directory) => {
        const files = safeArray(directory.files);
        const isOpen = expanded[directory.path] ?? false;

        return (
          <div
            key={directory.path}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]"
          >
            <button
              type="button"
              onClick={() => toggle(directory.path)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FolderOpen size={16} className="shrink-0 text-cyan-300" />
                <span className="break-all text-sm font-medium text-gray-100">
                  {directory.path}
                </span>
              </div>

              <ChevronDown
                size={16}
                className={`shrink-0 text-gray-500 transition ${
                  isOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-white/10 p-4">
                {files.length === 0 ? (
                  <EmptyText text="문서화된 파일이 없습니다." />
                ) : (
                  files.map((file) => (
                    <div
                      key={file.path}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <FileCode2
                          size={16}
                          className="mt-0.5 shrink-0 text-purple-300"
                        />
                        <p className="break-all text-sm font-semibold text-gray-100">
                          {file.path}
                        </p>
                      </div>

                      <div className="mt-3 space-y-3">
                        {safeArray(file.classes).map((clazz) => (
                          <div
                            key={clazz.symbolId ?? clazz.name}
                            className="rounded-lg border border-white/10 bg-white/[0.025] p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-100">
                                {clazz.name}
                              </p>

                              {clazz.estimated && (
                                <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[11px] text-yellow-200">
                                  estimated
                                </span>
                              )}
                            </div>

                            {clazz.summary && (
                              <p className="mt-2 text-sm leading-6 text-gray-300">
                                {clazz.summary}
                              </p>
                            )}

                            {safeArray(clazz.methods).length > 0 && (
                              <div className="mt-3 space-y-2">
                                {safeArray(clazz.methods).map((method) => (
                                  <div
                                    key={method.symbolId ?? method.name}
                                    className="rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium text-cyan-100">
                                        {method.name}
                                      </span>

                                      {method.estimated && (
                                        <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
                                          estimated
                                        </span>
                                      )}
                                    </div>

                                    {method.summary && (
                                      <p className="mt-1 text-sm text-gray-400">
                                        {method.summary}
                                      </p>
                                    )}

                                    {(safeArray(method.relatedRules).length > 0 ||
                                      safeArray(method.relatedScenarios).length >
                                        0) && (
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {safeArray(method.relatedRules).map(
                                          (rule) => (
                                            <span
                                              key={rule}
                                              className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] text-purple-200"
                                            >
                                              {rule}
                                            </span>
                                          )
                                        )}

                                        {safeArray(
                                          method.relatedScenarios
                                        ).map((scenario) => (
                                          <span
                                            key={scenario}
                                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200"
                                          >
                                            {scenario}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScenarioPanel({ data }) {
  const scenarios = safeArray(data?.scenarios);

  if (scenarios.length === 0) {
    return <EmptyText text="시나리오 결과가 없습니다." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {scenarios.map((scenario) => (
        <article
          key={scenario.scenarioId}
          className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200">
              {scenario.scenarioId}
            </span>

            {scenario.subsystem && (
              <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[11px] text-purple-200">
                {scenario.subsystem}
              </span>
            )}
          </div>

          <h4 className="mt-3 text-base font-bold text-gray-100">
            {scenario.title}
          </h4>

          <ol className="mt-4 space-y-3">
            {safeArray(scenario.steps).map((step) => (
              <li key={step.stepNo} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300">
                  {step.stepNo}
                </span>

                <div className="min-w-0">
                  <p className="text-sm leading-6 text-gray-300">
                    {step.description}
                  </p>

                  {safeArray(step.evidenceLinks).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {safeArray(step.evidenceLinks).map((evidence, index) => (
                        <p
                          key={`${evidence.evidenceId}-${index}`}
                          className="break-all text-xs text-gray-500"
                        >
                          근거 #{evidence.evidenceId} · {evidence.filePath}
                          {evidence.lines ? `:${evidence.lines}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  );
}

function SubsystemPanel({ data }) {
  const subsystems = safeArray(data?.subsystems);

  if (subsystems.length === 0) {
    return <EmptyText text="서브시스템 요약 결과가 없습니다." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {subsystems.map((subsystem) => (
        <article
          key={subsystem.subsystemId}
          className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-300">
              {subsystem.subsystemId}
            </span>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
              {formatLayer(subsystem.layer)}
            </span>
          </div>

          <h4 className="mt-3 text-base font-bold text-gray-100">
            {subsystem.label}
          </h4>

          {subsystem.description && (
            <p className="mt-2 text-sm leading-6 text-gray-300">
              {subsystem.description}
            </p>
          )}

          {safeArray(subsystem.topSymbols).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Top Symbols
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {safeArray(subsystem.topSymbols).map((symbol) => (
                  <span
                    key={symbol}
                    className="break-all rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
          )}

          {safeArray(subsystem.ruleIds).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {safeArray(subsystem.ruleIds).map((ruleId) => (
                <span
                  key={ruleId}
                  className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[11px] text-purple-200"
                >
                  {ruleId}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function ApiDocsPanel({ data }) {
  const apiEntries = safeArray(data?.apiEntries);

  if (apiEntries.length === 0) {
    return <EmptyText text="API 문서 결과가 없습니다." />;
  }

  return (
    <div className="space-y-3">
      {apiEntries.map((entry) => (
        <article
          key={entry.fqn}
          className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            {entry.subsystem && (
              <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[11px] text-purple-200">
                {entry.subsystem}
              </span>
            )}

            {safeArray(entry.relatedScenarios).map((scenario) => (
              <span
                key={scenario}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200"
              >
                {scenario}
              </span>
            ))}
          </div>

          <h4 className="mt-3 break-all text-sm font-bold text-gray-100">
            {entry.fqn}
          </h4>

          {entry.summary && (
            <p className="mt-2 text-sm leading-6 text-gray-300">
              {entry.summary}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function RawFallback({ data }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-gray-300">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function LlmResultSection({
  results,
  loading = false,
  error = null,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState(TAB.SCENARIO);

  const counts = useMemo(
    () => ({
      scenario: countOf(results?.scenarioSpecs?.scenarios),
      subsystem: countOf(results?.subsystemSummaries?.subsystems),
      api: countOf(results?.apiDocs?.apiEntries),
      fileTree: countOf(results?.fileTreeDocs?.directories),
    }),
    [results]
  );

  const hasResult = hasAnyLlmResult(results);

  const tabs = [
    {
      key: TAB.SCENARIO,
      label: "시나리오",
      count: counts.scenario,
      icon: ListChecks,
    },
    {
      key: TAB.SUBSYSTEM,
      label: "서브시스템",
      count: counts.subsystem,
      icon: Boxes,
    },
    {
      key: TAB.API,
      label: "API 문서",
      count: counts.api,
      icon: BookOpen,
    },
    {
      key: TAB.FILE_TREE,
      label: "파일 트리 문서",
      count: counts.fileTree,
      icon: FolderOpen,
    },
  ];

  const activeData =
    activeTab === TAB.SCENARIO
      ? results?.scenarioSpecs
      : activeTab === TAB.SUBSYSTEM
        ? results?.subsystemSummaries
        : activeTab === TAB.API
          ? results?.apiDocs
          : results?.fileTreeDocs;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl">
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(250,204,21,0.45), rgba(168,85,247,0.5), transparent)",
        }}
      />

      <div className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-100">
              <Bot size={21} className="text-yellow-300" />
              LLM Result
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              정적 분석 산출물을 바탕으로 생성한 시나리오, 서브시스템 요약,
              API 문서, 파일 트리 설명입니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <RefreshCw size={15} />
            LLM 결과 새로고침
          </button>
        </div>

        {loading && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-gray-300">
            <RefreshCw size={16} className="animate-spin" />
            LLM 결과를 불러오는 중입니다.
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-950/10 px-4 py-4 text-sm text-red-200">
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !hasResult && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-6 text-sm text-gray-500">
            아직 표시할 LLM 결과 산출물이 없습니다.
          </div>
        )}

        {hasResult && (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                      active
                        ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-[10px]">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {activeTab === TAB.SCENARIO && activeData?.scenarios ? (
                <ScenarioPanel data={activeData} />
              ) : activeTab === TAB.SUBSYSTEM &&
                activeData?.subsystems ? (
                <SubsystemPanel data={activeData} />
              ) : activeTab === TAB.API && activeData?.apiEntries ? (
                <ApiDocsPanel data={activeData} />
              ) : activeTab === TAB.FILE_TREE && activeData?.directories ? (
                <FileTreePanel data={activeData} />
              ) : (
                <RawFallback data={activeData} />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}