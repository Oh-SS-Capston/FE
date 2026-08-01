export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function pickFirst(obj, keys, fallback = null) {
  if (!isRecord(obj)) {
    return fallback;
  }

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }

  return fallback;
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

function unwrapPayload(value) {
  const parsed = parseMaybeJson(value);

  if (!isRecord(parsed)) {
    return parsed ?? {};
  }

  if ("content" in parsed && parsed.content != null) {
    return unwrapPayload(parsed.content);
  }

  if ("result" in parsed && parsed.result != null) {
    return unwrapPayload(parsed.result);
  }

  if ("data" in parsed && parsed.data != null) {
    return unwrapPayload(parsed.data);
  }

  return parsed;
}

export function normalizeLicenseAnalysis(raw) {
  const unwrapped = unwrapPayload(raw);
  const source = isRecord(unwrapped) ? unwrapped : {};
  const projectLicense = pickFirst(source, ["projectLicense", "project_license"], {});
  const displayPolicy = pickFirst(source, ["displayPolicy", "display_policy"], {});

  return {
    schemaVersion: pickFirst(source, ["schemaVersion", "schema_version"], "-"),
    generatedAt: pickFirst(source, ["generatedAt", "generated_at"], null),
    analysisScope: pickFirst(source, ["analysisScope", "analysis_scope"], "-"),
    projectLicense: isRecord(projectLicense) ? projectLicense : {},
    displayPolicy: isRecord(displayPolicy) ? displayPolicy : {},
    reviewItems: safeArray(pickFirst(source, ["reviewItems", "review_items"], [])),
    evidences: safeArray(
      pickFirst(source, ["evidences", "evidenceList", "evidence_list"], [])
    ),
  };
}

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }

  return `${Math.round(Math.max(0, Math.min(1, number)) * 100)}%`;
}

export function formatReviewLevel(level) {
  switch (String(level ?? "").toUpperCase()) {
    case "LOW":
      return "낮음";
    case "MEDIUM":
      return "보통";
    case "HIGH":
      return "높음";
    default:
      return level || "-";
  }
}

export function licenseTone(spdxId, manualReviewRequired) {
  if (manualReviewRequired || spdxId === "UNKNOWN") {
    return {
      border: "border-amber-300/30",
      bg: "from-amber-300/15 via-orange-400/10 to-transparent",
      text: "text-amber-100",
      chip: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    };
  }

  if (String(spdxId).includes("GPL") || String(spdxId).includes("AGPL")) {
    return {
      border: "border-fuchsia-300/30",
      bg: "from-fuchsia-300/15 via-purple-400/10 to-transparent",
      text: "text-fuchsia-100",
      chip: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
    };
  }

  return {
    border: "border-emerald-300/30",
    bg: "from-emerald-300/15 via-cyan-300/10 to-transparent",
    text: "text-emerald-100",
    chip: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  };
}

export function buildLicenseViewModel(raw) {
  const normalized = normalizeLicenseAnalysis(raw);
  const projectLicense = normalized.projectLicense;
  const displayPolicy = normalized.displayPolicy;

  const spdxId = pickFirst(projectLicense, ["spdxId", "spdx_id"], "UNKNOWN");
  const manualReviewRequired = Boolean(
    pickFirst(displayPolicy, ["requireManualReview", "require_manual_review"], false)
  );

  return {
    ...normalized,
    spdxId,
    displayName: pickFirst(projectLicense, ["displayName", "display_name"], spdxId),
    family: pickFirst(projectLicense, ["family"], "-"),
    reviewLevel: pickFirst(projectLicense, ["reviewLevel", "review_level"], "-"),
    confidence: pickFirst(projectLicense, ["confidence"], null),
    summary: pickFirst(projectLicense, ["summary"], ""),
    manualReviewRequired,
    warnings: safeArray(pickFirst(displayPolicy, ["warnings"], [])),
    permissions: safeArray(pickFirst(projectLicense, ["permissions"], [])),
    obligations: safeArray(pickFirst(projectLicense, ["obligations"], [])),
    notices: safeArray(pickFirst(projectLicense, ["notices"], [])),
    tone: licenseTone(spdxId, manualReviewRequired),
  };
}
