import {
  buildLicenseViewModel,
  formatPercent,
  formatReviewLevel,
  pickFirst,
} from "./licenseAnalysisModel";
import {
  formatLicenseEvidenceSource,
  formatLicenseEvidenceType,
} from "./licenseEvidenceModel";

function fallbackText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatList(title, items) {
  if (items.length === 0) {
    return [`## ${title}`, "- 없음"].join("\n");
  }

  return [`## ${title}`, ...items.map((item) => `- ${item}`)].join("\n");
}

function formatEvidenceLine(evidence, index) {
  const path = pickFirst(evidence, ["path", "filePath", "file_path"], "알 수 없는 파일");
  const source = formatLicenseEvidenceSource(
    pickFirst(evidence, ["source", "sourceType", "source_type"], "UNKNOWN_SOURCE")
  );
  const type = formatLicenseEvidenceType(
    pickFirst(evidence, ["evidenceType", "evidence_type", "type"], "UNKNOWN_TYPE")
  );

  return `${index + 1}. ${path} (${source}, ${type})`;
}

function formatReviewItems(reviewItems) {
  return reviewItems.map((item) =>
    fallbackText(
      pickFirst(item, ["message", "description", "title", "type"], null),
      "검토가 필요한 항목입니다."
    )
  );
}

export function buildLicenseReportMarkdown(analysis, context = {}) {
  // 화면에서 확인한 대표 라이선스 결과를 PR/이슈에 바로 붙일 수 있는 요약 문서로 변환합니다.
  const license = buildLicenseViewModel(analysis);
  const repository = fallbackText(context.repo, "unknown repository");
  const generatedAt = license.generatedAt
    ? new Date(license.generatedAt).toLocaleString()
    : "-";
  const reviewStatus = license.manualReviewRequired
    ? "수동 검토 필요"
    : "자동 판단 가능";

  const reviewNotes = [
    ...license.warnings.map((warning) => fallbackText(warning)),
    ...formatReviewItems(license.reviewItems),
  ];

  const sections = [
    "# 대표 라이선스 분석 리포트",
    "",
    `- Repository: ${repository}`,
    `- Run ID: ${fallbackText(context.runId)}`,
    `- SPDX ID: ${fallbackText(license.spdxId, "UNKNOWN")}`,
    `- 표시 이름: ${fallbackText(license.displayName)}`,
    `- 라이선스 계열: ${fallbackText(license.family)}`,
    `- 검토 등급: ${formatReviewLevel(license.reviewLevel)}`,
    `- 신뢰도: ${formatPercent(license.confidence)}`,
    `- 검토 상태: ${reviewStatus}`,
    `- 생성 시각: ${generatedAt}`,
    "",
    "## 요약",
    fallbackText(license.summary, "요약 문구가 없습니다."),
    "",
    formatList("허용되는 대표 행위", license.permissions),
    "",
    formatList("지켜야 할 의무", license.obligations),
    "",
    formatList("주의 안내", license.notices),
    "",
    formatList("검토 포인트", reviewNotes),
    "",
    "## 판단 근거",
    license.evidences.length > 0
      ? license.evidences.map(formatEvidenceLine).join("\n")
      : "- 연결된 근거 파일이 없습니다.",
  ];

  return sections.join("\n");
}

export function buildLicenseReportJson(analysis, context = {}) {
  // 사람이 읽는 요약값과 백엔드 원본 산출물을 함께 담아 추후 재검토 근거를 잃지 않게 합니다.
  const license = buildLicenseViewModel(analysis);

  return {
    runId: context.runId ?? null,
    repository: context.repo ?? null,
    exportedAt: new Date().toISOString(),
    license: {
      spdxId: license.spdxId,
      displayName: license.displayName,
      family: license.family,
      reviewLevel: license.reviewLevel,
      confidence: license.confidence,
      manualReviewRequired: license.manualReviewRequired,
      summary: license.summary,
      permissions: license.permissions,
      obligations: license.obligations,
      notices: license.notices,
      warnings: license.warnings,
      reviewItems: license.reviewItems,
      evidences: license.evidences,
    },
    raw: analysis,
  };
}

export function buildLicenseReportFilename(runId, extension) {
  // runId는 파일명에 들어가므로 Windows에서 문제가 되는 문자를 안전한 하이픈으로 치환합니다.
  const normalizedRunId = fallbackText(runId, "unknown")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80);

  return `license-report-${normalizedRunId}.${extension}`;
}
