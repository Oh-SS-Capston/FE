import { pickFirst } from "./licenseAnalysisModel";

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}

export function normalizeEvidenceText(value) {
  return String(value ?? "").toLowerCase();
}

export function getLicenseEvidenceSource(evidence) {
  return pickFirst(
    evidence,
    ["source", "sourceType", "source_type"],
    "UNKNOWN_SOURCE"
  );
}

export function buildLicenseEvidenceViewModel(evidence, index = 0) {
  // 백엔드 근거 JSON의 snake_case/camelCase 차이를 화면에서 쓰기 쉬운 단일 구조로 정리합니다.
  const startLine = pickFirst(evidence, ["startLine", "start_line"], null);
  const endLine = pickFirst(evidence, ["endLine", "end_line"], null);
  const hasLineRange = hasText(startLine) && hasText(endLine);
  const lineLabel = hasLineRange
    ? String(startLine) === String(endLine)
      ? `L${startLine}`
      : `L${startLine}-L${endLine}`
    : "line -";

  return {
    evidenceId: pickFirst(
      evidence,
      ["evidenceId", "id"],
      `evidence-${index + 1}`
    ),
    path: pickFirst(evidence, ["path", "filePath", "file_path"], "unknown path"),
    startLine,
    endLine,
    source: getLicenseEvidenceSource(evidence),
    type: pickFirst(
      evidence,
      ["evidenceType", "evidence_type", "type"],
      "LICENSE_EVIDENCE"
    ),
    snippet: pickFirst(
      evidence,
      ["snippet", "contextSnippet", "context_snippet"],
      ""
    ),
    lineLabel,
    hasLineRange,
  };
}

export function buildLicenseEvidenceCopyText(evidence, index = 0) {
  // 사람이 직접 검토할 때 필요한 파일 위치와 원문 일부를 한 번에 복사할 수 있게 구성합니다.
  const viewModel = buildLicenseEvidenceViewModel(evidence, index);
  const lines = [
    `Evidence: ${viewModel.evidenceId}`,
    `Path: ${viewModel.path}`,
    `Line: ${viewModel.lineLabel}`,
    `Source: ${viewModel.source}`,
    `Type: ${viewModel.type}`,
  ];

  if (hasText(viewModel.snippet)) {
    lines.push("", viewModel.snippet);
  }

  return lines.join("\n");
}

export function buildLicenseEvidenceSearchText(evidence, index = 0) {
  // 검색 패널에서는 사용자가 파일명, source, 근거 유형, 원문 일부로 찾을 수 있어야 합니다.
  const viewModel = buildLicenseEvidenceViewModel(evidence, index);

  return [
    viewModel.evidenceId,
    viewModel.path,
    viewModel.source,
    viewModel.type,
    viewModel.snippet,
  ]
    .map(normalizeEvidenceText)
    .join(" ");
}
