const DIRECT_ARTIFACT_FIELDS = [
  "licenseAnalysisArtifactId",
  "licenseAnalysisId",
  "projectLicenseArtifactId",
  "licenseArtifactId",
];

const ARTIFACT_TYPE_TOKENS = [
  "LICENSE_ANALYSIS_JSON",
  "LICENSE_ANALYSIS",
  "PROJECT_LICENSE",
];

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

/**
 * 진행 조회 응답에서 대표 라이선스 산출물 ID만 찾습니다.
 * 백엔드 응답 구조가 직접 필드, 중첩 필드, artifact 목록 중 어디로 와도 같은 방식으로 흡수합니다.
 */
export function resolveLicenseAnalysisArtifactId(progress) {
  const artifacts = progress?.artifacts;
  const artifactList = getArtifactList(artifacts, progress);
  const artifactIds = artifacts?.artifactIds ?? progress?.artifactIds ?? null;

  return (
    firstNonEmptyString(
      ...DIRECT_ARTIFACT_FIELDS.map((field) => artifacts?.[field]),
      artifacts?.licenseAnalysis?.artifactId,
      artifacts?.licenseAnalysis?.id,
      artifacts?.license?.artifactId,
      artifacts?.license?.id,
      ...ARTIFACT_TYPE_TOKENS.map((token) => artifactIds?.[token]),
      artifactIds?.licenseAnalysis,
      artifactIds?.license_analysis,
      progress?.licenseAnalysisArtifactId
    ) || findArtifactIdFromList(artifactList, ARTIFACT_TYPE_TOKENS)
  );
}

export function getLicenseStepFailure(progress) {
  return progress?.failedSteps?.find((step) => step.stage === "LICENSE") ?? null;
}
