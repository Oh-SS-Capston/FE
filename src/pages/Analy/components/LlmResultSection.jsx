import { useEffect, useMemo, useState } from "react";
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
  REFINED_RULES: "REFINED_RULES",
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function countOf(value) {
  return Array.isArray(value) ? value.length : 0;
}

function parseMaybeJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function unwrapPayload(value) {
  const parsed = parseMaybeJson(value);

  if (!isRecord(parsed)) {
    return parsed;
  }

  if ("content" in parsed && parsed.content != null) {
    return parseMaybeJson(parsed.content);
  }

  if ("result" in parsed && parsed.result != null) {
    return parseMaybeJson(parsed.result);
  }

  if ("data" in parsed && parsed.data != null) {
    return parseMaybeJson(parsed.data);
  }

  return parsed;
}

function pickFirst(obj, keys) {
  if (!isRecord(obj)) {
    return undefined;
  }

  for (const key of keys) {
    if (obj[key] != null) {
      return obj[key];
    }
  }

  return undefined;
}

function pickSection(source, keys) {
  if (!isRecord(source)) {
    return null;
  }

  for (const key of keys) {
    if (source[key] != null) {
      return unwrapPayload(source[key]);
    }
  }

  return null;
}

function normalizeLlmResults(results) {
  const root = unwrapPayload(results);
  const source = isRecord(root) ? root : {};

  return {
    scenarioSpecs: pickSection(source, [
      "scenarioSpecs",
      "scenario_specs",
      "llmScenarioSpecs",
      "llm_scenario_specs",
    ]),
    subsystemSummaries: pickSection(source, [
      "subsystemSummaries",
      "subsystem_summaries",
      "llmSubsystemSummaries",
      "llm_subsystem_summaries",
    ]),
    apiDocs: pickSection(source, [
      "apiDocs",
      "api_docs",
      "llmApiDocs",
      "llm_api_docs",
    ]),
    fileTreeDocs: pickSection(source, [
      "fileTreeDocs",
      "file_tree_docs",
      "llmFileTreeDocs",
      "llm_file_tree_docs",
    ]),
    refinedRules: pickSection(source, [
      "refinedRules",
      "refined_rules",
      "llmRefinedRules",
      "llm_refined_rules",
      "rules",
    ]),
  };
}

function hasScenarioData(data) {
  return (
    countOf(pickFirst(data, ["scenarios"])) > 0 ||
    isRecord(pickFirst(data, ["overview", "overviewSeed"])) ||
    countOf(pickFirst(data, ["cautions"])) > 0
  );
}

function hasSubsystemData(data) {
  return (
    countOf(pickFirst(data, ["subsystems"])) > 0 ||
    countOf(pickFirst(data, ["coreClasses", "core_classes"])) > 0 ||
    countOf(pickFirst(data, ["extensionPoints", "extension_points"])) > 0
  );
}

function hasApiData(data) {
  return (
    countOf(pickFirst(data, ["apiEntries", "api_entries"])) > 0 ||
    countOf(pickFirst(data, ["coreMethods", "core_methods"])) > 0 ||
    countOf(pickFirst(data, ["methodUsageOrder", "method_usage_order"])) > 0
  );
}

function hasFileTreeData(data) {
  return (
    countOf(pickFirst(data, ["directories"])) > 0 ||
    countOf(pickFirst(data, ["evidenceLocations", "evidence_locations"])) > 0 ||
    countOf(pickFirst(data, ["coreMethods", "core_methods"])) > 0
  );
}

function hasRefinedRuleData(data) {
  return (
    countOf(pickFirst(data, ["rules"])) > 0 ||
    countOf(pickFirst(data, ["cautions"])) > 0
  );
}

function hasAnyLlmResult(normalized) {
  return (
    hasScenarioData(normalized?.scenarioSpecs) ||
    hasSubsystemData(normalized?.subsystemSummaries) ||
    hasApiData(normalized?.apiDocs) ||
    hasFileTreeData(normalized?.fileTreeDocs) ||
    hasRefinedRuleData(normalized?.refinedRules)
  );
}

function formatLayer(layer) {
  if (!layer) {
    return "-";
  }

  switch (String(layer).toLowerCase()) {
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

function normalizePath(path) {
  if (!path) {
    return "";
  }
  return String(path).replace(/\\/g, "/");
}

function extractDirectoryPath(filePath) {
  const normalized = normalizePath(filePath);
  const idx = normalized.lastIndexOf("/");
  if (idx <= 0) {
    return "(root)";
  }
  return normalized.slice(0, idx);
}

function lineText(startLine, endLine) {
  if (startLine == null && endLine == null) {
    return "";
  }

  if (startLine != null && endLine != null) {
    return startLine === endLine ? `:${startLine}` : `:${startLine}-${endLine}`;
  }

  if (startLine != null) {
    return `:${startLine}`;
  }

  return `:${endLine}`;
}

function buildDirectoriesFromEvidence(evidenceLocations) {
  const byDirectory = new Map();

  for (const evidence of safeArray(evidenceLocations)) {
    const filePath = evidence?.filePath || evidence?.path;
    if (!filePath) {
      continue;
    }

    const normalizedPath = normalizePath(filePath);
    const directoryPath = extractDirectoryPath(normalizedPath);

    if (!byDirectory.has(directoryPath)) {
      byDirectory.set(directoryPath, new Map());
    }

    const filesMap = byDirectory.get(directoryPath);
    if (!filesMap.has(normalizedPath)) {
      filesMap.set(normalizedPath, {
        path: normalizedPath,
        classes: [],
        evidences: [],
      });
    }

    filesMap.get(normalizedPath).evidences.push(evidence);
  }

  return Array.from(byDirectory.entries()).map(([path, filesMap]) => ({
    path,
    files: Array.from(filesMap.values()),
  }));
}

function methodClassName(method) {
  if (!method) {
    return "(UnknownClass)";
  }

  if (method.classFqn) {
    return method.classFqn;
  }

  if (method.class_fqn) {
    return method.class_fqn;
  }

  if (method.ownerTypeFqn) {
    return method.ownerTypeFqn;
  }

  if (method.owner_type_fqn) {
    return method.owner_type_fqn;
  }

  if (typeof method.fqn === "string") {
    const hashIdx = method.fqn.indexOf("#");
    if (hashIdx > 0) {
      return method.fqn.slice(0, hashIdx);
    }

    const dotIdx = method.fqn.lastIndexOf(".");
    if (dotIdx > 0) {
      return method.fqn.slice(0, dotIdx);
    }
  }

  return "(UnknownClass)";
}

function methodDisplayName(method) {
  if (!method) {
    return "-";
  }

  if (method.methodName) {
    return method.methodName;
  }

  if (method.name) {
    return method.name;
  }

  if (typeof method.fqn === "string") {
    const hashIdx = method.fqn.lastIndexOf("#");
    if (hashIdx >= 0 && hashIdx < method.fqn.length - 1) {
      return method.fqn.slice(hashIdx + 1);
    }

    const dotIdx = method.fqn.lastIndexOf(".");
    if (dotIdx >= 0 && dotIdx < method.fqn.length - 1) {
      return method.fqn.slice(dotIdx + 1);
    }

    return method.fqn;
  }

  return "-";
}

function methodSourcePath(method) {
  const evidence = isRecord(method?.evidence) ? method.evidence : null;

  return (
    method?.sourceFile ||
    method?.source_file ||
    method?.filePath ||
    method?.path ||
    evidence?.filePath ||
    evidence?.path ||
    null
  );
}

function buildDirectoriesFromCoreMethods(coreMethods) {
  const byDirectory = new Map();

  for (const method of safeArray(coreMethods)) {
    const className = methodClassName(method);
    const sourcePath = methodSourcePath(method);
    const normalizedPath = sourcePath
      ? normalizePath(sourcePath)
      : `(unknown-source)/${className.replace(/[^a-zA-Z0-9_.$-]/g, "_")}.java`;
    const directoryPath = extractDirectoryPath(normalizedPath);

    if (!byDirectory.has(directoryPath)) {
      byDirectory.set(directoryPath, new Map());
    }

    const filesMap = byDirectory.get(directoryPath);
    if (!filesMap.has(normalizedPath)) {
      filesMap.set(normalizedPath, {
        path: normalizedPath,
        classes: [],
        evidences: [],
      });
    }

    const fileEntry = filesMap.get(normalizedPath);
    let classEntry = fileEntry.classes.find((clazz) => clazz?.name === className);

    if (!classEntry) {
      classEntry = {
        name: className,
        summary: null,
        methods: [],
      };
      fileEntry.classes.push(classEntry);
    }

    const symbolId =
      method?.symbolId ||
      method?.symbol_id ||
      method?.fqn ||
      `${className}.${methodDisplayName(method)}`;

    const alreadyAdded = classEntry.methods.some(
      (existing) => existing?.symbolId === symbolId
    );

    if (!alreadyAdded) {
      classEntry.methods.push({
        symbolId,
        name: methodDisplayName(method),
        summary: method?.whatItDoes || method?.summary || null,
        summaryPreview:
          method?.whatItDoesPreview ||
          method?.summaryPreview ||
          method?.whatItDoes ||
          method?.summary ||
          null,
        summaryFull:
          method?.whatItDoesFull ||
          method?.summaryFull ||
          method?.whatItDoes ||
          method?.summary ||
          null,
        summaryTruncated: Boolean(
          method?.whatItDoesTruncated ?? method?.summaryTruncated
        ),
        estimated: Boolean(method?.estimated),
        relatedRules: safeArray(method?.relatedRules || method?.ruleIds),
        relatedScenarios: safeArray(
          method?.relatedScenarios || method?.scenarioIds
        ),
      });
    }

    const evidence = isRecord(method?.evidence) ? method.evidence : {};
    const startLine =
      method?.startLine ?? method?.start_line ?? evidence?.startLine ?? evidence?.start_line;
    const endLine =
      method?.endLine ?? method?.end_line ?? evidence?.endLine ?? evidence?.end_line;

    fileEntry.evidences.push({
      kind: "CORE_METHOD",
      evidenceId: symbolId,
      fqn: method?.fqn || symbolId,
      startLine,
      endLine,
      snippet: method?.whatItDoes || method?.summary || method?.whenToUse || null,
    });
  }

  return Array.from(byDirectory.entries()).map(([path, filesMap]) => ({
    path,
    files: Array.from(filesMap.values()),
  }));
}

function ExpandableText({
  preview,
  full,
  truncated,
  className = "mt-1 text-sm text-gray-300",
  buttonClassName = "mt-1 text-xs text-cyan-300 hover:text-cyan-200",
}) {
  const [expanded, setExpanded] = useState(false);

  const previewText = typeof preview === "string" ? preview.trim() : "";
  const fullText = typeof full === "string" ? full.trim() : "";

  const resolvedPreview = previewText || fullText;
  const resolvedFull = fullText || previewText;

  const canExpand =
    Boolean(truncated) &&
    resolvedPreview.length > 0 &&
    resolvedFull.length > 0 &&
    resolvedPreview !== resolvedFull;

  const visibleText = expanded ? resolvedFull : resolvedPreview;

  if (!visibleText) {
    return null;
  }

  return (
    <>
      <p className={className}>{visibleText}</p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={buttonClassName}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </>
  );
}

function FileTreePanel({ data }) {
  const evidenceLocations = safeArray(
    pickFirst(data, ["evidenceLocations", "evidence_locations"])
  );
  const coreMethods = safeArray(pickFirst(data, ["coreMethods", "core_methods"]));
  const rawDirectories = safeArray(pickFirst(data, ["directories"]));
  const directoriesFromEvidence = buildDirectoriesFromEvidence(evidenceLocations);
  const directoriesFromCoreMethods = buildDirectoriesFromCoreMethods(coreMethods);

  const directories =
    rawDirectories.length > 0
      ? rawDirectories
      : directoriesFromCoreMethods.length > 0
      ? directoriesFromCoreMethods
      : directoriesFromEvidence;

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
      {directories.map((directory, dirIndex) => {
        const files = safeArray(directory?.files);
        const dirPath = directory?.path || `(unknown-${dirIndex})`;
        const isOpen = expanded[dirPath] ?? false;

        return (
          <div
            key={`${dirPath}-${dirIndex}`}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]"
          >
            <button
              type="button"
              onClick={() => toggle(dirPath)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FolderOpen size={16} className="shrink-0 text-cyan-300" />
                <span className="break-all text-sm font-medium text-gray-100">
                  {dirPath}
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
                  files.map((file, fileIndex) => {
                    const classes = safeArray(file?.classes);
                    const fileEvidences = safeArray(file?.evidences);

                    return (
                      <div
                        key={`${file?.path || "unknown-file"}-${fileIndex}`}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start gap-2">
                          <FileCode2
                            size={16}
                            className="mt-0.5 shrink-0 text-purple-300"
                          />
                          <p className="break-all text-sm font-semibold text-gray-100">
                            {file?.path || "-"}
                          </p>
                        </div>

                        <div className="mt-3 space-y-3">
                          {classes.length > 0 &&
                            classes.map((clazz, classIndex) => (
                              <div
                                key={`${clazz?.symbolId || clazz?.name || "class"}-${classIndex}`}
                                className="rounded-lg border border-white/10 bg-white/[0.025] p-3"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-gray-100">
                                    {clazz?.name || "-"}
                                  </p>

                                  {clazz?.estimated && (
                                    <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[11px] text-yellow-200">
                                      estimated
                                    </span>
                                  )}
                                </div>

                                {clazz?.summary && (
                                  <p className="mt-2 text-sm leading-6 text-gray-300">
                                    {clazz.summary}
                                  </p>
                                )}

                                {safeArray(clazz?.methods).length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {safeArray(clazz.methods).map(
                                      (method, methodIndex) => (
                                        <div
                                          key={`${method?.symbolId || method?.name || "method"}-${methodIndex}`}
                                          className="rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                                        >
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-cyan-100">
                                              {method?.name || "-"}
                                            </span>

                                            {method?.estimated && (
                                              <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
                                                estimated
                                              </span>
                                            )}
                                          </div>

                                          {(method?.summary ||
                                            method?.summaryPreview ||
                                            method?.summaryFull) && (
                                            <ExpandableText
                                              preview={
                                                method?.summaryPreview ||
                                                method?.summary ||
                                                method?.summaryFull
                                              }
                                              full={
                                                method?.summaryFull ||
                                                method?.summary ||
                                                method?.summaryPreview
                                              }
                                              truncated={method?.summaryTruncated}
                                              className="mt-1 text-sm text-gray-400"
                                            />
                                          )}

                                          {(safeArray(method?.relatedRules)
                                            .length > 0 ||
                                            safeArray(method?.relatedScenarios)
                                              .length > 0) && (
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
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}

                          {classes.length === 0 && fileEvidences.length === 0 && (
                            <EmptyText text="파일 상세 문서가 없습니다." />
                          )}

                          {fileEvidences.length > 0 && (
                            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Evidence
                              </p>
                              <div className="mt-2 space-y-2">
                                {fileEvidences.map((ev, evIndex) => (
                                  <div
                                    key={`${ev?.evidenceId || "ev"}-${evIndex}`}
                                    className="rounded border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-gray-300"
                                  >
                                    <p>
                                      {ev?.kind || "EVIDENCE"}
                                      {ev?.evidenceId ? ` #${ev.evidenceId}` : ""}{" "}
                                      {lineText(ev?.startLine, ev?.endLine)}
                                    </p>
                                    {ev?.fqn && (
                                      <p className="mt-0.5 break-all text-gray-400">
                                        {ev.fqn}
                                      </p>
                                    )}
                                    {ev?.snippet && (
                                      <p className="mt-1 break-all text-gray-500">
                                        {ev.snippet}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
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
  const overview = pickFirst(data, ["overview", "overviewSeed"]);
  const scenarios = safeArray(pickFirst(data, ["scenarios"]));
  const cautions = safeArray(pickFirst(data, ["cautions"]));

  if (scenarios.length === 0 && !isRecord(overview) && cautions.length === 0) {
    return <EmptyText text="시나리오 결과가 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {isRecord(overview) && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">
            {overview?.project || "프로젝트 개요"}
          </h4>

          {overview?.purpose && (
            <p className="mt-2 text-sm leading-6 text-gray-300">
              {overview.purpose}
            </p>
          )}

          {overview?.fitSituation && (
            <p className="mt-2 text-sm leading-6 text-gray-400">
              적용 상황: {overview.fitSituation}
            </p>
          )}

          {overview?.coreFeatures && (
            <p className="mt-2 text-sm leading-6 text-gray-400">
              핵심 기능: {overview.coreFeatures}
            </p>
          )}

          {overview?.startGuide && (
            <p className="mt-2 text-sm leading-6 text-gray-400">
              시작 가이드: {overview.startGuide}
            </p>
          )}
        </article>
      )}

      {scenarios.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {scenarios.map((scenario, scenarioIndex) => (
            <article
              key={`${scenario?.scenarioId || "scenario"}-${scenarioIndex}`}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200">
                  {scenario?.scenarioId || "-"}
                </span>

                {scenario?.subsystem && (
                  <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[11px] text-purple-200">
                    {scenario.subsystem}
                  </span>
                )}
              </div>

              <h4 className="mt-3 text-base font-bold text-gray-100">
                {scenario?.title || "-"}
              </h4>

              {scenario?.intent && (
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {scenario.intent}
                </p>
              )}

              <ol className="mt-4 space-y-3">
                {safeArray(scenario?.steps).map((step, stepIndex) => (
                  <li key={`${step?.stepNo || stepIndex}`} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300">
                      {step?.stepNo || stepIndex + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm leading-6 text-gray-300">
                        {step?.description || "-"}
                      </p>

                      {(step?.classFqn || step?.methodFqn) && (
                        <p className="mt-1 break-all text-xs text-gray-500">
                          {step?.classFqn || "-"}
                          {step?.methodFqn ? ` · ${step.methodFqn}` : ""}
                        </p>
                      )}

                      {safeArray(step?.evidenceLinks).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {safeArray(step.evidenceLinks).map((evidence, idx) => (
                            <p
                              key={`${evidence?.evidenceId || "evidence"}-${idx}`}
                              className="break-all text-xs text-gray-500"
                            >
                              근거 #{evidence?.evidenceId || "-"} ·{" "}
                              {evidence?.filePath || "-"}
                              {evidence?.lines ? `:${evidence.lines}` : ""}
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
      )}

      {cautions.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">주의사항</h4>
          <div className="mt-3 space-y-3">
            {cautions.map((caution, idx) => (
              <div
                key={`${caution?.cautionId || "caution"}-${idx}`}
                className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3"
              >
                <p className="text-sm font-semibold text-yellow-100">
                  {caution?.title || caution?.cautionId || "주의"}
                </p>
                {caution?.message && (
                  <p className="mt-1 text-sm leading-6 text-yellow-50/90">
                    {caution.message}
                  </p>
                )}
                {caution?.when && (
                  <p className="mt-1 text-xs text-yellow-100/80">
                    언제: {caution.when}
                  </p>
                )}
              </div>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}

function SubsystemPanel({ data }) {
  const subsystems = safeArray(pickFirst(data, ["subsystems"]));
  const coreClasses = safeArray(pickFirst(data, ["coreClasses", "core_classes"]));
  const extensionPoints = safeArray(
    pickFirst(data, ["extensionPoints", "extension_points"])
  );

  if (
    subsystems.length === 0 &&
    coreClasses.length === 0 &&
    extensionPoints.length === 0
  ) {
    return <EmptyText text="서브시스템 요약 결과가 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {subsystems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {subsystems.map((subsystem, index) => (
            <article
              key={`${subsystem?.subsystemId || "sub"}-${index}`}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-300">
                  {subsystem?.subsystemId || "-"}
                </span>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
                  {formatLayer(subsystem?.layer)}
                </span>
              </div>

              <h4 className="mt-3 text-base font-bold text-gray-100">
                {subsystem?.label || "-"}
              </h4>

              {subsystem?.description && (
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  {subsystem.description}
                </p>
              )}

              {safeArray(subsystem?.topSymbols).length > 0 && (
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

              {safeArray(subsystem?.ruleIds).length > 0 && (
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
      )}

      {coreClasses.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Core Classes</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {coreClasses.map((clazz, idx) => (
              <div
                key={`${clazz?.symbolId || clazz?.fqn || "class"}-${idx}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <p className="break-all text-sm font-semibold text-gray-100">
                  {clazz?.fqn || clazz?.name || "-"}
                </p>
                {clazz?.role && (
                  <p className="mt-1 text-xs text-gray-500">{clazz.role}</p>
                )}
                {clazz?.summary && (
                  <p className="mt-2 text-sm text-gray-300">{clazz.summary}</p>
                )}
              </div>
            ))}
          </div>
        </article>
      )}

      {extensionPoints.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Extension Points</h4>
          <div className="mt-3 space-y-3">
            {extensionPoints.map((point, idx) => (
              <div
                key={`${point?.symbolId || point?.classFqn || "ext"}-${idx}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <p className="break-all text-sm font-semibold text-gray-100">
                  {point?.classFqn || point?.name || "-"}
                </p>
                {point?.reason && (
                  <p className="mt-1 text-sm text-gray-300">{point.reason}</p>
                )}
              </div>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}

function ApiDocsPanel({ data }) {
  const apiEntries = safeArray(pickFirst(data, ["apiEntries", "api_entries"]));
  const coreMethods = safeArray(pickFirst(data, ["coreMethods", "core_methods"]));
  const methodUsageOrder = safeArray(
    pickFirst(data, ["methodUsageOrder", "method_usage_order"])
  );

  if (
    apiEntries.length === 0 &&
    coreMethods.length === 0 &&
    methodUsageOrder.length === 0
  ) {
    return <EmptyText text="API 문서 결과가 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {methodUsageOrder.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Method Usage Order</h4>
          <ol className="mt-3 space-y-2">
            {methodUsageOrder.map((item, idx) => (
              <li
                key={`${item?.order || idx}-${item?.methodFqn || "flow"}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <p className="text-sm font-semibold text-gray-100">
                  {(item?.order || idx + 1) + ". "}
                  {item?.title || item?.methodFqn || "-"}
                </p>
                {item?.description && (
                  <p className="mt-1 text-sm text-gray-300">{item.description}</p>
                )}
                {(item?.methodFqn || item?.classFqn) && (
                  <p className="mt-1 break-all text-xs text-gray-500">
                    {item?.classFqn || "-"}
                    {item?.methodFqn ? ` · ${item.methodFqn}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </article>
      )}

      {apiEntries.length > 0 && (
        <div className="space-y-3">
          {apiEntries.map((entry, idx) => (
            <article
              key={`${entry?.fqn || "entry"}-${idx}`}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                {entry?.subsystem && (
                  <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[11px] text-purple-200">
                    {entry.subsystem}
                  </span>
                )}

                {safeArray(entry?.relatedScenarios).map((scenario) => (
                  <span
                    key={scenario}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200"
                  >
                    {scenario}
                  </span>
                ))}
              </div>

              <h4 className="mt-3 break-all text-sm font-bold text-gray-100">
                {entry?.fqn || "-"}
              </h4>

              {(entry?.summary || entry?.summaryPreview || entry?.summaryFull) && (
                <ExpandableText
                  preview={entry?.summaryPreview || entry?.summary || entry?.summaryFull}
                  full={entry?.summaryFull || entry?.summary || entry?.summaryPreview}
                  truncated={entry?.summaryTruncated}
                  className="mt-2 text-sm leading-6 text-gray-300"
                />
              )}
            </article>
          ))}
        </div>
      )}

      {coreMethods.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Core Methods</h4>
          <div className="mt-3 space-y-3">
            {coreMethods.map((method, idx) => (
              <div
                key={`${method?.fqn || method?.methodName || "method"}-${idx}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <p className="break-all text-sm font-semibold text-gray-100">
                  {method?.fqn || `${method?.classFqn || ""}.${method?.methodName || ""}`}
                </p>

                {(method?.whatItDoes ||
                  method?.whatItDoesPreview ||
                  method?.whatItDoesFull) && (
                  <ExpandableText
                    preview={
                      method?.whatItDoesPreview ||
                      method?.whatItDoes ||
                      method?.whatItDoesFull
                    }
                    full={
                      method?.whatItDoesFull ||
                      method?.whatItDoes ||
                      method?.whatItDoesPreview
                    }
                    truncated={method?.whatItDoesTruncated}
                    className="mt-1 text-sm text-gray-300"
                  />
                )}

                {method?.whenToUse && (
                  <p className="mt-1 text-xs text-gray-500">
                    언제 사용: {method.whenToUse}
                  </p>
                )}

                {(method?.inputs || method?.returns) && (
                  <div className="mt-2 space-y-1 text-xs text-gray-400">
                    {method?.inputs && <p>입력: {method.inputs}</p>}
                    {method?.returns && <p>반환: {method.returns}</p>}
                  </div>
                )}

                {safeArray(method?.cautions).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {safeArray(method.cautions).map((caution, cIdx) => (
                      <span
                        key={`${caution}-${cIdx}`}
                        className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200"
                      >
                        {caution}
                      </span>
                    ))}
                  </div>
                )}

                {isRecord(method?.evidence) && (
                  <p className="mt-2 break-all text-xs text-gray-500">
                    근거: {method.evidence?.filePath || "-"}
                    {lineText(method.evidence?.startLine, method.evidence?.endLine)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}

function RefinedRulesPanel({ data }) {
  const rules = safeArray(pickFirst(data, ["rules"]));
  const cautions = safeArray(pickFirst(data, ["cautions"]));

  if (rules.length === 0 && cautions.length === 0) {
    return <EmptyText text="정제 규칙 결과가 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {rules.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Rules</h4>
          <div className="mt-3 space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={`${rule?.ruleId || rule?.name || "rule"}-${idx}`}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {rule?.ruleId && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-100">
                      {rule.ruleId}
                    </span>
                  )}

                  {rule?.classification && (
                    <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[11px] text-purple-100">
                      {rule.classification}
                    </span>
                  )}
                </div>

                {rule?.name && (
                  <p className="mt-2 text-sm font-semibold text-gray-100">
                    {rule.name}
                  </p>
                )}

                {rule?.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    {rule.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </article>
      )}

      {cautions.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Cautions</h4>
          <div className="mt-3 space-y-3">
            {cautions.map((caution, idx) => (
              <div
                key={`${caution?.cautionId || caution?.title || "caution"}-${idx}`}
                className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3"
              >
                <p className="text-sm font-semibold text-yellow-100">
                  {caution?.title || caution?.cautionId || "주의"}
                </p>

                {caution?.message && (
                  <p className="mt-1 text-sm leading-6 text-yellow-50/90">
                    {caution.message}
                  </p>
                )}

                {caution?.when && (
                  <p className="mt-1 text-xs text-yellow-100/80">
                    언제: {caution.when}
                  </p>
                )}
              </div>
            ))}
          </div>
        </article>
      )}
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
  const llm = useMemo(() => normalizeLlmResults(results), [results]);

  const [activeTab, setActiveTab] = useState(TAB.SCENARIO);
  const [userSelectedTab, setUserSelectedTab] = useState(false);

  const counts = useMemo(
    () => ({
      scenario: countOf(pickFirst(llm?.scenarioSpecs, ["scenarios"])),
      subsystem: countOf(pickFirst(llm?.subsystemSummaries, ["subsystems"])),
      api:
        countOf(pickFirst(llm?.apiDocs, ["apiEntries", "api_entries"])) ||
        countOf(pickFirst(llm?.apiDocs, ["coreMethods", "core_methods"])),
      fileTree:
        countOf(pickFirst(llm?.fileTreeDocs, ["directories"])) ||
        countOf(
          pickFirst(llm?.fileTreeDocs, [
            "evidenceLocations",
            "evidence_locations",
          ])
        ) ||
        countOf(pickFirst(llm?.fileTreeDocs, ["coreMethods", "core_methods"])),
      refinedRules:
        countOf(pickFirst(llm?.refinedRules, ["rules"])) ||
        countOf(pickFirst(llm?.refinedRules, ["cautions"])),
    }),
    [llm]
  );

  const tabHasData = useMemo(
    () => ({
      [TAB.SCENARIO]: hasScenarioData(llm?.scenarioSpecs),
      [TAB.SUBSYSTEM]: hasSubsystemData(llm?.subsystemSummaries),
      [TAB.API]: hasApiData(llm?.apiDocs),
      [TAB.FILE_TREE]: hasFileTreeData(llm?.fileTreeDocs),
      [TAB.REFINED_RULES]: hasRefinedRuleData(llm?.refinedRules),
    }),
    [llm]
  );

  useEffect(() => {
    if (userSelectedTab) {
      return;
    }

    if (tabHasData[activeTab]) {
      return;
    }

    const next = [
      TAB.SCENARIO,
      TAB.SUBSYSTEM,
      TAB.API,
      TAB.FILE_TREE,
      TAB.REFINED_RULES,
    ].find(
      (tab) => tabHasData[tab]
    );

    if (next) {
      setActiveTab(next);
    }
  }, [activeTab, tabHasData, userSelectedTab]);

  const hasResult = hasAnyLlmResult(llm);

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
    {
      key: TAB.REFINED_RULES,
      label: "정제 규칙",
      count: counts.refinedRules,
      icon: ListChecks,
    },
  ];

  const activeData =
    activeTab === TAB.SCENARIO
      ? llm?.scenarioSpecs
      : activeTab === TAB.SUBSYSTEM
      ? llm?.subsystemSummaries
      : activeTab === TAB.API
      ? llm?.apiDocs
      : activeTab === TAB.FILE_TREE
      ? llm?.fileTreeDocs
      : llm?.refinedRules;

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
            disabled={!onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                    onClick={() => {
                      setUserSelectedTab(true);
                      setActiveTab(tab.key);
                    }}
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
              {activeTab === TAB.SCENARIO && hasScenarioData(activeData) ? (
                <ScenarioPanel data={activeData} />
              ) : activeTab === TAB.SUBSYSTEM && hasSubsystemData(activeData) ? (
                <SubsystemPanel data={activeData} />
              ) : activeTab === TAB.API && hasApiData(activeData) ? (
                <ApiDocsPanel data={activeData} />
              ) : activeTab === TAB.FILE_TREE && hasFileTreeData(activeData) ? (
                <FileTreePanel data={activeData} />
              ) : activeTab === TAB.REFINED_RULES &&
                hasRefinedRuleData(activeData) ? (
                <RefinedRulesPanel data={activeData} />
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









