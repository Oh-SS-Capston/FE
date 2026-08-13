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

function isEntryRoleToken(value) {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toUpperCase();
  return normalized === "PRIMARY" || normalized === "SECONDARY";
}

function getEntryRoleGuide(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "PRIMARY") {
    return {
      code: "PRIMARY",
      label: "주요 진입점",
      description: "공개 API 사용 흐름에서 사용자가 직접 시작할 가능성이 높은 진입점 후보입니다.",
    };
  }
  if (normalized === "SECONDARY") {
    return {
      code: "SECONDARY",
      label: "보조 사용 지점",
      description:
        "공개 API가 반환해 이어서 사용하는 타입으로, 일반적으로 직접 시작점으로 선택되지는 않습니다.",
    };
  }
  return null;
}

function resolveClassRoleGuide(clazz) {
  const roleToken =
    (typeof clazz?.role === "string" && clazz.role.trim()) ||
    (typeof clazz?.summary === "string" && clazz.summary.trim()) ||
    "";
  return getEntryRoleGuide(roleToken);
}

function resolveClassSummary(clazz) {
  const roleGuide = resolveClassRoleGuide(clazz);
  if (roleGuide) {
    return roleGuide.description;
  }
  return typeof clazz?.summary === "string" ? clazz.summary.trim() : "";
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

function classIdentityKey(clazz) {
  const raw =
    (typeof clazz?.name === "string" && clazz.name.trim()) ||
    (typeof clazz?.classFqn === "string" && clazz.classFqn.trim()) ||
    (typeof clazz?.fqn === "string" && clazz.fqn.trim()) ||
    "";
  if (!raw) {
    return "";
  }
  const simple = raw.includes(".") ? raw.slice(raw.lastIndexOf(".") + 1) : raw;
  return simple.toLowerCase();
}

function methodIdentityKey(method) {
  const raw =
    (typeof method?.symbolId === "string" && method.symbolId.trim()) ||
    (typeof method?.symbol_id === "string" && method.symbol_id.trim()) ||
    (typeof method?.fqn === "string" && method.fqn.trim()) ||
    methodDisplayName(method);
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function mergeStringArray(left, right) {
  return Array.from(new Set([...safeArray(left), ...safeArray(right)].filter(Boolean)));
}

function mergeMethodWithCore(rawMethod, coreMethod) {
  const raw = isRecord(rawMethod) ? rawMethod : {};
  const core = isRecord(coreMethod) ? coreMethod : {};
  const merged = { ...raw, ...core };

  const symbolId =
    (typeof core?.symbolId === "string" && core.symbolId.trim()) ||
    (typeof raw?.symbolId === "string" && raw.symbolId.trim()) ||
    (typeof core?.fqn === "string" && core.fqn.trim()) ||
    (typeof raw?.fqn === "string" && raw.fqn.trim()) ||
    "";
  if (symbolId) {
    merged.symbolId = symbolId;
  }

  const name = firstText([core?.name, core?.methodName, raw?.name, raw?.methodName]);
  if (name) {
    merged.name = name;
  }

  const summary = firstText([
    core?.guideNarrative,
    core?.summaryFull,
    core?.summaryPreview,
    core?.summaryNarrative,
    core?.summary,
    raw?.guideNarrative,
    raw?.summaryFull,
    raw?.summaryPreview,
    raw?.summaryNarrative,
    raw?.summary,
  ]);

  merged.guideNarrative = firstText([core?.guideNarrative, raw?.guideNarrative, summary]);
  merged.summary = firstText([summary, merged.guideNarrative]);
  merged.summaryPreview = firstText([
    core?.summaryPreview,
    core?.summaryFull,
    raw?.summaryPreview,
    raw?.summaryFull,
    summary,
  ]);
  merged.summaryFull = firstText([
    core?.summaryFull,
    core?.summaryPreview,
    raw?.summaryFull,
    raw?.summaryPreview,
    summary,
  ]);
  merged.summaryTruncated = Boolean(
    core?.summaryTruncated ?? raw?.summaryTruncated ?? false
  );

  const resolvedGuideSlots = resolveMethodGuideSlots(merged);
  if (hasGuideSlots(resolvedGuideSlots)) {
    merged.guideSlots = resolvedGuideSlots;
  }

  merged.slotEvidence = isRecord(core?.slotEvidence)
    ? core.slotEvidence
    : isRecord(raw?.slotEvidence)
    ? raw.slotEvidence
    : null;
  merged.guideQuality = isRecord(core?.guideQuality)
    ? core.guideQuality
    : isRecord(raw?.guideQuality)
    ? raw.guideQuality
    : null;
  merged.actionabilityScore = Number.isFinite(Number(core?.actionabilityScore))
    ? Number(core.actionabilityScore)
    : raw?.actionabilityScore;
  merged.relatedRules = mergeStringArray(raw?.relatedRules || raw?.ruleIds, core?.relatedRules || core?.ruleIds);
  merged.relatedScenarios = mergeStringArray(
    raw?.relatedScenarios || raw?.scenarioIds,
    core?.relatedScenarios || core?.scenarioIds
  );
  merged.estimated = Boolean(raw?.estimated) || Boolean(core?.estimated);

  return merged;
}

function mergeMethodsWithCore(rawMethods, coreMethods) {
  const coreByIdentity = new Map();
  const coreByName = new Map();
  for (const coreMethod of safeArray(coreMethods)) {
    const identityKey = methodIdentityKey(coreMethod);
    if (identityKey && !coreByIdentity.has(identityKey)) {
      coreByIdentity.set(identityKey, coreMethod);
    }
    const nameKey = methodDisplayName(coreMethod).toLowerCase();
    if (nameKey && !coreByName.has(nameKey)) {
      coreByName.set(nameKey, coreMethod);
    }
  }

  const usedCoreMethods = new Set();
  const merged = [];

  for (const rawMethod of safeArray(rawMethods)) {
    const identityKey = methodIdentityKey(rawMethod);
    const nameKey = methodDisplayName(rawMethod).toLowerCase();
    const coreMatch =
      (identityKey && coreByIdentity.get(identityKey)) ||
      (nameKey && coreByName.get(nameKey)) ||
      null;
    if (coreMatch) {
      usedCoreMethods.add(coreMatch);
    }
    merged.push(mergeMethodWithCore(rawMethod, coreMatch));
  }

  for (const coreMethod of safeArray(coreMethods)) {
    if (usedCoreMethods.has(coreMethod)) {
      continue;
    }
    merged.push(mergeMethodWithCore(null, coreMethod));
  }

  return merged;
}

function mergeClassWithCore(rawClass, coreClass) {
  const raw = isRecord(rawClass) ? rawClass : {};
  const core = isRecord(coreClass) ? coreClass : {};
  const rawSummary = typeof raw?.summary === "string" ? raw.summary.trim() : "";
  const coreSummary = typeof core?.summary === "string" ? core.summary.trim() : "";

  const merged = { ...raw, ...core };
  merged.name = firstText([raw?.name, core?.name, raw?.classFqn, core?.classFqn]) || "-";
  merged.role = firstText([
    core?.role,
    raw?.role,
    isEntryRoleToken(rawSummary) ? rawSummary : "",
    isEntryRoleToken(coreSummary) ? coreSummary : "",
  ]);
  merged.summary = firstText([
    isEntryRoleToken(coreSummary) ? "" : coreSummary,
    isEntryRoleToken(rawSummary) ? "" : rawSummary,
  ]);
  merged.estimated = Boolean(raw?.estimated) || Boolean(core?.estimated);
  merged.methods = mergeMethodsWithCore(raw?.methods, core?.methods);
  return merged;
}

function mergeClassesWithCore(rawClasses, coreClasses) {
  const coreByKey = new Map();
  for (const coreClass of safeArray(coreClasses)) {
    const key = classIdentityKey(coreClass);
    if (key && !coreByKey.has(key)) {
      coreByKey.set(key, coreClass);
    }
  }

  const usedKeys = new Set();
  const merged = [];

  for (const rawClass of safeArray(rawClasses)) {
    const key = classIdentityKey(rawClass);
    const coreMatch = key ? coreByKey.get(key) : null;
    if (coreMatch) {
      usedKeys.add(key);
    }
    merged.push(mergeClassWithCore(rawClass, coreMatch));
  }

  for (const coreClass of safeArray(coreClasses)) {
    const key = classIdentityKey(coreClass);
    if (key && usedKeys.has(key)) {
      continue;
    }
    merged.push(mergeClassWithCore(null, coreClass));
  }

  return merged;
}

function mergeEvidenceEntries(rawEvidences, coreEvidences) {
  const out = [];
  const seen = new Set();
  for (const evidence of [...safeArray(rawEvidences), ...safeArray(coreEvidences)]) {
    const identity = [
      evidence?.kind,
      evidence?.evidenceId,
      evidence?.fqn,
      evidence?.startLine,
      evidence?.endLine,
    ]
      .map((value) => (value == null ? "" : String(value)))
      .join("|");
    if (seen.has(identity)) {
      continue;
    }
    seen.add(identity);
    out.push(evidence);
  }
  return out;
}

function mergeFileEntryWithCore(rawFile, coreFile) {
  const raw = isRecord(rawFile) ? rawFile : {};
  const core = isRecord(coreFile) ? coreFile : {};
  return {
    ...core,
    ...raw,
    path: firstText([raw?.path, core?.path]) || "-",
    classes: mergeClassesWithCore(raw?.classes, core?.classes),
    evidences: mergeEvidenceEntries(raw?.evidences, core?.evidences),
  };
}

function mergeDirectoryWithCore(rawDirectory, coreDirectory) {
  const raw = isRecord(rawDirectory) ? rawDirectory : {};
  const core = isRecord(coreDirectory) ? coreDirectory : {};
  const coreFileByPath = new Map();
  for (const coreFile of safeArray(core?.files)) {
    const key = normalizePath(coreFile?.path || "");
    if (key && !coreFileByPath.has(key)) {
      coreFileByPath.set(key, coreFile);
    }
  }

  const usedFilePath = new Set();
  const mergedFiles = [];
  for (const rawFile of safeArray(raw?.files)) {
    const key = normalizePath(rawFile?.path || "");
    const coreMatch = key ? coreFileByPath.get(key) : null;
    if (coreMatch) {
      usedFilePath.add(key);
    }
    mergedFiles.push(mergeFileEntryWithCore(rawFile, coreMatch));
  }

  for (const coreFile of safeArray(core?.files)) {
    const key = normalizePath(coreFile?.path || "");
    if (key && usedFilePath.has(key)) {
      continue;
    }
    mergedFiles.push(mergeFileEntryWithCore(null, coreFile));
  }

  return {
    ...core,
    ...raw,
    path: firstText([raw?.path, core?.path]) || "(root)",
    files: mergedFiles,
  };
}

function mergeDirectoriesWithCoreMethods(rawDirectories, coreMethodDirectories) {
  const rawList = safeArray(rawDirectories);
  const coreList = safeArray(coreMethodDirectories);

  if (rawList.length === 0) {
    return coreList;
  }

  const coreByPath = new Map();
  for (const coreDir of coreList) {
    const key = normalizePath(coreDir?.path || "");
    if (key && !coreByPath.has(key)) {
      coreByPath.set(key, coreDir);
    }
  }

  const usedDirectoryPath = new Set();
  const merged = [];
  for (const rawDir of rawList) {
    const key = normalizePath(rawDir?.path || "");
    const coreMatch = key ? coreByPath.get(key) : null;
    if (coreMatch) {
      usedDirectoryPath.add(key);
    }
    merged.push(mergeDirectoryWithCore(rawDir, coreMatch));
  }

  for (const coreDir of coreList) {
    const key = normalizePath(coreDir?.path || "");
    if (key && usedDirectoryPath.has(key)) {
      continue;
    }
    merged.push(mergeDirectoryWithCore(null, coreDir));
  }

  return merged;
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
      const guideSlots = resolveMethodGuideSlots(method);
      classEntry.methods.push({
        symbolId,
        name: methodDisplayName(method),
        guideNarrative:
          method?.guideNarrative ||
          method?.whatItDoes ||
          method?.summaryNarrative ||
          method?.summary ||
          null,
        guideSlots,
        guideQuality: isRecord(method?.guideQuality) ? method.guideQuality : null,
        slotEvidence: isRecord(method?.slotEvidence) ? method.slotEvidence : null,
        actionabilityScore: method?.actionabilityScore,
        summary:
          method?.guideNarrative ||
          method?.whatItDoes ||
          method?.summaryNarrative ||
          method?.summary ||
          null,
        summaryPreview:
          method?.guideNarrative ||
          method?.whatItDoesFull ||
          method?.summaryFull ||
          method?.whatItDoesPreview ||
          method?.summaryPreview ||
          method?.whatItDoes ||
          method?.summaryNarrative ||
          method?.summary ||
          null,
        summaryFull:
          method?.guideNarrative ||
          method?.whatItDoesFull ||
          method?.summaryFull ||
          method?.whatItDoes ||
          method?.summaryNarrative ||
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
      snippet:
        method?.guideNarrative ||
        method?.whatItDoes ||
        method?.summaryNarrative ||
        method?.summary ||
        method?.whenToUse ||
        null,
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

function compactText(value) {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || "";
}

function GuideDisclosureCard({
  title,
  badges = null,
  preview = "",
  children,
  raw = null,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showRaw, setShowRaw] = useState(false);
  const previewText = compactText(preview);
  const hasRaw = raw != null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/20">
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-all text-sm font-semibold text-gray-100">{title || "-"}</p>
          {badges}
        </div>

        {previewText && <p className="mt-2 text-sm leading-6 text-gray-300">{previewText}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-400/15"
          >
            {expanded ? "상세 접기" : "상세 보기"}
          </button>

          {hasRaw && (
            <button
              type="button"
              onClick={() => setShowRaw((prev) => !prev)}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-200 hover:bg-white/10"
            >
              {showRaw ? "원문 접기" : "원문 보기"}
            </button>
          )}
        </div>
      </div>

      {expanded && <div className="border-t border-white/10 p-3">{children}</div>}

      {showRaw && hasRaw && (
        <div className="border-t border-white/10 p-3">
          <pre className="max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-6 text-gray-300">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function normalizeGuideSlots(value) {
  if (!isRecord(value)) {
    return null;
  }

  return {
    beforeCall: typeof value.beforeCall === "string" ? value.beforeCall.trim() : "",
    doCall: typeof value.doCall === "string" ? value.doCall.trim() : "",
    successCheck:
      typeof value.successCheck === "string" ? value.successCheck.trim() : "",
    failureSymptom:
      typeof value.failureSymptom === "string" ? value.failureSymptom.trim() : "",
    nextAction: typeof value.nextAction === "string" ? value.nextAction.trim() : "",
  };
}

function hasGuideSlots(value) {
  const slots = normalizeGuideSlots(value);
  if (!slots) {
    return false;
  }
  return Boolean(
    slots.beforeCall ||
      slots.doCall ||
      slots.successCheck ||
      slots.failureSymptom ||
      slots.nextAction
  );
}

function formatScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function firstText(values) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return "";
}

function hasAnyGuideSlot(slots) {
  return Boolean(
    slots?.beforeCall ||
      slots?.doCall ||
      slots?.successCheck ||
      slots?.failureSymptom ||
      slots?.nextAction
  );
}

function fallbackMethodGuideSlots(method) {
  const summary = firstText([
    method?.guideNarrative,
    method?.whatItDoes,
    method?.summaryNarrative,
    method?.summary,
  ]);
  const cautionText = firstText(safeArray(method?.cautions));
  const whenToUse = firstText([method?.whenToUse]);
  const inputs = firstText([method?.inputs]);
  const returns = firstText([method?.returns]);

  return {
    beforeCall:
      whenToUse ||
      (inputs
        ? `호출 전에 입력 조건을 점검한다. (${inputs})`
        : "호출 전에 입력값과 선행 호출 순서를 점검한다."),
    doCall: summary || "핵심 메서드를 호출해 동작을 수행한다.",
    successCheck:
      returns
        ? `반환 값은 ${returns} 기준으로 확인한다.`
        : "호출 결과를 후속 분기 조건과 비교해 성공 여부를 확인한다.",
    failureSymptom:
      cautionText || "입력 누락 또는 상태 불일치 시 예외/오동작이 발생할 수 있다.",
    nextAction: inputs
      ? `입력 조건을 보완하고 재호출한다. (${inputs})`
      : "입력값과 호출 순서를 보완한 뒤 재시도한다.",
  };
}

function resolveMethodGuideSlots(method) {
  const explicit = normalizeGuideSlots(method?.guideSlots);
  if (hasAnyGuideSlot(explicit)) {
    return explicit;
  }
  return fallbackMethodGuideSlots(method);
}

function fallbackRuleGuideSlots(rule) {
  const classification = firstText([rule?.classification]);
  const description = firstText([rule?.description]);
  const name = firstText([rule?.name, rule?.ruleId]);
  const evidenceIds = safeArray(rule?.evidenceIds).filter(Boolean);
  const evidenceText =
    evidenceIds.length > 0
      ? `근거 ID(${evidenceIds.slice(0, 3).join(", ")})를 기준으로 검증한다.`
      : "테스트/로그에서 해당 규칙 위반 징후를 검증한다.";

  return {
    beforeCall: classification
      ? `${classification} 규칙이 적용되는 호출 구간에서 점검한다.`
      : "관련 호출 구간에서 규칙을 점검한다.",
    doCall: description || `${name || "규칙"}을 확인한다.`,
    successCheck: evidenceText,
    failureSymptom:
      description || "규칙 위반 시 예외 또는 잘못된 분기가 발생할 수 있다.",
    nextAction:
      "위반 조건을 만족하지 않도록 입력값/호출 순서를 수정하고 다시 검증한다.",
  };
}

function fallbackCautionGuideSlots(caution) {
  const when = firstText([caution?.when]);
  const message = firstText([caution?.message]);
  const action = firstText([caution?.summary?.action]);
  const relatedMethod = firstText([caution?.relatedMethod]);
  const evidenceIds = safeArray(caution?.evidenceIds).filter(Boolean);
  const evidenceText =
    evidenceIds.length > 0 ? `근거 ID: ${evidenceIds.slice(0, 3).join(", ")}` : "";

  return {
    beforeCall:
      when ||
      (relatedMethod
        ? `${relatedMethod} 호출 전에 점검한다.`
        : "관련 메서드 호출 전에 점검한다."),
    doCall: message || "주의 조건을 확인한다.",
    successCheck: relatedMethod
      ? `${relatedMethod} 호출 결과가 기대값과 일치하는지 확인한다.`
      : "호출 결과가 기대값과 일치하는지 확인한다.",
    failureSymptom:
      message || "조건 미충족 시 예외 또는 오동작이 발생할 수 있다.",
    nextAction:
      action || "입력값을 보완하고 선행 검증을 추가한 뒤 재시도한다.",
    evidenceText,
  };
}

function GuideSlotItem({ label, text, evidence }) {
  if (!text) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] font-semibold tracking-wide text-cyan-200">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-gray-300">{text}</p>
      {evidence && (
        <p className="mt-1 break-all text-[11px] text-gray-500">근거: {evidence}</p>
      )}
    </div>
  );
}

export function FileTreeDocsPanel({ data }) {
  const evidenceLocations = safeArray(
    pickFirst(data, ["evidenceLocations", "evidence_locations"])
  );
  const coreMethods = safeArray(pickFirst(data, ["coreMethods", "core_methods"]));
  const rawDirectories = safeArray(pickFirst(data, ["directories"]));
  const directoriesFromEvidence = buildDirectoriesFromEvidence(evidenceLocations);
  const directoriesFromCoreMethods = buildDirectoriesFromCoreMethods(coreMethods);
  const mergedDirectories = mergeDirectoriesWithCoreMethods(
    rawDirectories,
    directoriesFromCoreMethods
  );
  const directories =
    mergedDirectories.length > 0 ? mergedDirectories : directoriesFromEvidence;

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
                              (() => {
                                const roleGuide = resolveClassRoleGuide(clazz);
                                const classSummary = resolveClassSummary(clazz);
                                return (
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

                                      {roleGuide && (
                                        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-100">
                                          {roleGuide.code} · {roleGuide.label}
                                        </span>
                                      )}
                                    </div>

                                    {classSummary && (
                                      <p className="mt-2 text-sm leading-6 text-gray-300">
                                        {classSummary}
                                      </p>
                                    )}

                                    {safeArray(clazz?.methods).length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        {safeArray(clazz.methods).map(
                                          (method, methodIndex) => (
                                            <GuideDisclosureCard
                                              key={`${method?.symbolId || method?.name || "method"}-${methodIndex}`}
                                              title={method?.name || "-"}
                                              preview={
                                                method?.guideNarrative ||
                                                method?.summaryFull ||
                                                method?.summaryPreview ||
                                                method?.summary
                                              }
                                              raw={method}
                                              badges={
                                                <>
                                                  {Number.isFinite(
                                                    Number(method?.actionabilityScore)
                                                  ) && (
                                                    <span
                                                      className={
                                                        Number(method?.actionabilityScore) >= 70
                                                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
                                                          : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-100"
                                                      }
                                                    >
                                                      실행 가능성 {formatScore(method?.actionabilityScore)}
                                                    </span>
                                                  )}
                                                  {method?.estimated && (
                                                    <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
                                                      estimated
                                                    </span>
                                                  )}
                                                </>
                                              }
                                            >
                                              {(method?.summary ||
                                                method?.summaryPreview ||
                                                method?.summaryFull) && (
                                                <ExpandableText
                                                  preview={
                                                    method?.summaryFull ||
                                                    method?.summaryPreview ||
                                                    method?.summary
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

                                              {hasGuideSlots(method?.guideSlots) && (
                                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                  <GuideSlotItem
                                                    label="호출 전 체크"
                                                    text={method?.guideSlots?.beforeCall}
                                                    evidence={method?.slotEvidence?.beforeCall}
                                                  />
                                                  <GuideSlotItem
                                                    label="호출 실행"
                                                    text={method?.guideSlots?.doCall}
                                                    evidence={method?.slotEvidence?.doCall}
                                                  />
                                                  <GuideSlotItem
                                                    label="성공 확인"
                                                    text={method?.guideSlots?.successCheck}
                                                    evidence={method?.slotEvidence?.successCheck}
                                                  />
                                                  <GuideSlotItem
                                                    label="실패 증상"
                                                    text={method?.guideSlots?.failureSymptom}
                                                    evidence={method?.slotEvidence?.failureSymptom}
                                                  />
                                                  <GuideSlotItem
                                                    label="다음 조치"
                                                    text={method?.guideSlots?.nextAction}
                                                    evidence={method?.slotEvidence?.nextAction}
                                                  />
                                                </div>
                                              )}

                                              {(safeArray(method?.relatedRules).length > 0 ||
                                                safeArray(method?.relatedScenarios).length >
                                                  0) && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                  {safeArray(method.relatedRules).map((rule) => (
                                                    <span
                                                      key={rule}
                                                      className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] text-purple-200"
                                                    >
                                                      {rule}
                                                    </span>
                                                  ))}

                                                  {safeArray(method.relatedScenarios).map(
                                                    (scenario) => (
                                                      <span
                                                        key={scenario}
                                                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200"
                                                      >
                                                        {scenario}
                                                      </span>
                                                    )
                                                  )}
                                                </div>
                                              )}
                                            </GuideDisclosureCard>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
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
  const coreMethods = safeArray(pickFirst(data, ["coreMethods", "core_methods"]));
  const methodUsageOrder = safeArray(
    pickFirst(data, ["methodUsageOrder", "method_usage_order"])
  );
  const apiQualityGate = pickFirst(data, ["qualityGate", "quality_gate"]);
  const qualityGate = isRecord(apiQualityGate) ? apiQualityGate : null;

  if (
    coreMethods.length === 0 &&
    methodUsageOrder.length === 0 &&
    !qualityGate
  ) {
    return <EmptyText text="API 문서 결과가 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {qualityGate && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-bold text-gray-100">API 품질 게이트</h4>
            <span
              className={
                qualityGate?.meetsThreshold
                  ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"
                  : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-100"
              }
            >
              {qualityGate?.meetsThreshold ? "임계치 충족" : "임계치 미달"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-cyan-100">
              평균 점수: {formatScore(qualityGate?.averageActionabilityScore)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-gray-200">
              최소 점수: {formatScore(qualityGate?.minActionabilityScore)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-gray-200">
              임계치: {formatScore(qualityGate?.threshold)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-gray-200">
              카드 수: {formatScore(qualityGate?.methodCount)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-gray-200">
              미달 카드: {formatScore(qualityGate?.belowThresholdCount)}
            </span>
          </div>
        </article>
      )}

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

      {coreMethods.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Core Methods</h4>
          <div className="mt-3 space-y-3">
            {coreMethods.map((method, idx) => {
              const guideSlots = normalizeGuideSlots(method?.guideSlots);
              const guideQuality = isRecord(method?.guideQuality)
                ? method.guideQuality
                : null;
              const qualityThreshold = Number(guideQuality?.threshold ?? 70);
              const qualityScore = Number(
                method?.actionabilityScore ?? guideQuality?.actionabilityScore
              );
              const scoreBadgeClass =
                qualityScore >= qualityThreshold
                  ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
                  : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-100";

              return (
                <GuideDisclosureCard
                  key={`${method?.fqn || method?.methodName || "method"}-${idx}`}
                  title={
                    method?.fqn || `${method?.classFqn || ""}.${method?.methodName || ""}`
                  }
                  preview={
                    method?.guideNarrative ||
                    method?.whatItDoesFull ||
                    method?.whatItDoesPreview ||
                    method?.summaryNarrative ||
                    method?.whatItDoes
                  }
                  raw={method}
                  badges={
                    Number.isFinite(qualityScore) ? (
                      <span className={scoreBadgeClass}>
                        실행 가능성 {formatScore(qualityScore)}
                      </span>
                    ) : null
                  }
                >
                  {(method?.guideNarrative ||
                    method?.whatItDoes ||
                    method?.summaryNarrative ||
                    method?.whatItDoesPreview ||
                    method?.whatItDoesFull) && (
                    <ExpandableText
                      preview={
                        method?.guideNarrative ||
                        method?.whatItDoesFull ||
                        method?.whatItDoesPreview ||
                        method?.summaryNarrative ||
                        method?.whatItDoes
                      }
                      full={
                        method?.guideNarrative ||
                        method?.whatItDoesFull ||
                        method?.summaryNarrative ||
                        method?.whatItDoes ||
                        method?.whatItDoesPreview
                      }
                      truncated={method?.whatItDoesTruncated}
                      className="mt-1 text-sm text-gray-300"
                    />
                  )}

                  {hasGuideSlots(guideSlots) && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <GuideSlotItem
                        label="호출 전 체크"
                        text={guideSlots?.beforeCall}
                        evidence={method?.slotEvidence?.beforeCall}
                      />
                      <GuideSlotItem
                        label="호출 실행"
                        text={guideSlots?.doCall}
                        evidence={method?.slotEvidence?.doCall}
                      />
                      <GuideSlotItem
                        label="성공 확인"
                        text={guideSlots?.successCheck}
                        evidence={method?.slotEvidence?.successCheck}
                      />
                      <GuideSlotItem
                        label="실패 증상"
                        text={guideSlots?.failureSymptom}
                        evidence={method?.slotEvidence?.failureSymptom}
                      />
                      <GuideSlotItem
                        label="다음 조치"
                        text={guideSlots?.nextAction}
                        evidence={method?.slotEvidence?.nextAction}
                      />
                    </div>
                  )}

                  {guideQuality && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-cyan-100">
                        슬롯 충족률 {formatScore(Number(guideQuality?.slotCoverage) * 100)}%
                      </span>
                      <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-purple-100">
                        근거 커버리지 {formatScore(Number(guideQuality?.evidenceCoverage) * 100)}%
                      </span>
                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-yellow-100">
                        반복률 {formatScore(Number(guideQuality?.repetitionRate) * 100)}%
                      </span>
                    </div>
                  )}

                  {(() => {
                    const metaRows = [
                      { label: "언제 사용", value: firstText([method?.whenToUse]) },
                      { label: "입력", value: firstText([method?.inputs]) },
                      { label: "반환", value: firstText([method?.returns]) },
                    ].filter((row) => row.value);

                    if (metaRows.length === 0) {
                      return null;
                    }

                    return (
                      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="space-y-2">
                          {metaRows.map((row) => (
                            <div
                              key={row.label}
                              className="grid gap-1 sm:grid-cols-[88px_1fr] sm:gap-3"
                            >
                              <span className="text-[11px] font-semibold tracking-wide text-cyan-200">
                                {row.label}
                              </span>
                              <p className="text-sm leading-6 text-gray-300">{row.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

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
                </GuideDisclosureCard>
              );
            })}
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
            {rules.map((rule, idx) => {
              const slots = fallbackRuleGuideSlots(rule);
              return (
                <GuideDisclosureCard
                  key={`${rule?.ruleId || rule?.name || "rule"}-${idx}`}
                  title={rule?.name || rule?.ruleId || "규칙"}
                  preview={rule?.description || slots.doCall}
                  raw={rule}
                  badges={
                    <>
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
                    </>
                  }
                >
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <GuideSlotItem label="적용 상황" text={slots.beforeCall} />
                    <GuideSlotItem label="핵심 내용" text={slots.doCall} />
                    <GuideSlotItem label="확인 방법" text={slots.successCheck} />
                    <GuideSlotItem label="실패 영향" text={slots.failureSymptom} />
                    <GuideSlotItem label="다음 조치" text={slots.nextAction} />
                  </div>
                </GuideDisclosureCard>
              );
            })}
          </div>
        </article>
      )}

      {cautions.length > 0 && (
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h4 className="text-base font-bold text-gray-100">Cautions</h4>
          <div className="mt-3 space-y-3">
            {cautions.map((caution, idx) => {
              const slots = fallbackCautionGuideSlots(caution);
              return (
                <GuideDisclosureCard
                  key={`${caution?.cautionId || caution?.title || "caution"}-${idx}`}
                  title={caution?.title || caution?.cautionId || "주의"}
                  preview={caution?.message || slots.doCall}
                  raw={caution}
                >
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <GuideSlotItem
                      label="언제 점검"
                      text={slots.beforeCall}
                      evidence={slots.evidenceText}
                    />
                    <GuideSlotItem label="무엇을 확인" text={slots.doCall} />
                    <GuideSlotItem label="성공 확인" text={slots.successCheck} />
                    <GuideSlotItem label="실패 증상" text={slots.failureSymptom} />
                    <GuideSlotItem label="다음 조치" text={slots.nextAction} />
                  </div>
                </GuideDisclosureCard>
              );
            })}
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

function formatRelativeAnalyzedTime(value) {
  if (!value) {
    return "방금 전";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "방금 전";
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) {
    return "방금 전";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function LlmResultSection({
  results,
  loading = false,
  error = null,
  onRefresh,
  onRegenerate,
  regenerating = false,
  showCachedNotice = false,
  cachedAnalyzedAt = null,
  showFileTreeTab = true,
}) {
  const llm = useMemo(() => normalizeLlmResults(results), [results]);
  const cachedAnalyzedTimeLabel = useMemo(
    () => formatRelativeAnalyzedTime(cachedAnalyzedAt),
    [cachedAnalyzedAt]
  );
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

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

    if ((showFileTreeTab || activeTab !== TAB.FILE_TREE) && tabHasData[activeTab]) {
      return;
    }

    const availableTabs = [
      TAB.SCENARIO,
      TAB.SUBSYSTEM,
      TAB.API,
      ...(showFileTreeTab ? [TAB.FILE_TREE] : []),
      TAB.REFINED_RULES,
    ];

    const next = availableTabs.find((tab) => tabHasData[tab]);

    if (next) {
      setActiveTab(next);
    }
  }, [activeTab, showFileTreeTab, tabHasData, userSelectedTab]);

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
  ].filter((tab) => showFileTreeTab || tab.key !== TAB.FILE_TREE);

  const hasResult = tabs.some((tab) => tabHasData[tab.key]);

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

  const handleOpenRegenerateModal = () => {
    if (!onRegenerate || regenerating) {
      return;
    }
    setShowRegenerateModal(true);
  };

  const handleCloseRegenerateModal = () => {
    if (regenerating) {
      return;
    }
    setShowRegenerateModal(false);
  };

  const handleConfirmRegenerate = async () => {
    if (!onRegenerate || regenerating) {
      return;
    }

    await onRegenerate();
    setShowRegenerateModal(false);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl">
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

            <p className="mt-2 text-sm text-gray-400">
              {showFileTreeTab
                ? "정적 분석 산출물을 바탕으로 생성한 시나리오, 서브시스템 요약, API 문서와 파일 설명입니다."
                : "정적 분석 산출물을 바탕으로 생성한 시나리오, 서브시스템 요약, API 문서와 규칙입니다."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={!onRefresh || regenerating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              LLM 결과 새로고침
            </button>

            <button
              type="button"
              onClick={handleOpenRegenerateModal}
              disabled={!onRegenerate || regenerating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={regenerating ? "animate-spin" : ""} />
              {regenerating ? "재생성 요청 중..." : "재생성"}
            </button>
          </div>
        </div>

        {showCachedNotice && (
          <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>기존 분석 결과 · 최근 분석 {cachedAnalyzedTimeLabel}</p>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-400/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-100">
                기존 분석 결과
              </span>
            </div>
          </div>
        )}

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
                <FileTreeDocsPanel data={activeData} />
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

      {showRegenerateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101426] p-5 shadow-2xl shadow-black/40">
            <h4 className="text-lg font-bold text-gray-100">새로 분석하시겠어요?</h4>

            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p>이미 분석된 결과 대신 새 분석을 진행합니다.</p>
              <p>신규 분석은 코드 규모와 빌드 환경에 따라 시간이 오래 걸릴 수 있습니다.</p>
              <p className="flex items-center gap-2 text-yellow-200">
                <TriangleAlert size={14} className="shrink-0" />
                추가 요금이 발생할 수 있습니다.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseRegenerateModal}
                disabled={regenerating}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleConfirmRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
                새로 분석하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}









