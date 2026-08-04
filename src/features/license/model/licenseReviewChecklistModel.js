import { buildLicenseViewModel } from "./licenseAnalysisModel";

function isCopyleftLicense(spdxId) {
  const normalized = String(spdxId ?? "").toUpperCase();
  return normalized.includes("GPL") || normalized.includes("AGPL");
}

function buildChecklistItem(id, label, description, priority, category) {
  return {
    id,
    label,
    description,
    priority,
    category,
  };
}

export function buildLicenseReviewChecklist(analysis) {
  // 대표 라이선스 결과를 사람이 확정하기 전에 확인해야 하는 작업 단위로 변환합니다.
  const license = buildLicenseViewModel(analysis);
  const items = [
    buildChecklistItem(
      "primary-evidence-reviewed",
      "대표 근거 파일 원문 확인",
      license.evidences.length > 0
        ? "LICENSE, README, 빌드 파일 등 연결된 근거 원문이 SPDX 판단과 일치하는지 확인합니다."
        : "근거 파일이 없으므로 저장소 루트의 LICENSE, README를 직접 확인합니다.",
      license.evidences.length > 0 ? "권장" : "필수",
      "evidence"
    ),
    buildChecklistItem(
      "spdx-confirmed",
      "SPDX ID 확정",
      `${license.spdxId} 값이 프로젝트에 표시할 대표 라이선스로 적절한지 확인합니다.`,
      license.spdxId === "UNKNOWN" ? "필수" : "확인",
      "decision"
    ),
    buildChecklistItem(
      "obligations-recorded",
      "의무사항 반영 여부 확인",
      license.obligations.length > 0
        ? `${license.obligations.length}개의 의무사항을 README, NOTICE, 배포 문서에 반영할지 확인합니다.`
        : "카탈로그 기준 별도 의무사항이 없는지 최종 확인합니다.",
      license.obligations.length > 0 ? "필수" : "확인",
      "policy"
    ),
    buildChecklistItem(
      "review-warnings-resolved",
      "검토 경고 처리",
      license.manualReviewRequired || license.warnings.length > 0
        ? "자동 분석 경고와 검토 항목을 확인하고 결과 확정 여부를 결정합니다."
        : "현재 산출물에 검토 경고가 없는지 확인합니다.",
      license.manualReviewRequired || license.warnings.length > 0 ? "필수" : "확인",
      "review"
    ),
  ];

  if (license.notices.length > 0) {
    items.push(
      buildChecklistItem(
        "notices-reviewed",
        "주의 안내 확인",
        `${license.notices.length}개의 주의 안내를 서비스 제공 방식에 맞게 검토합니다.`,
        "권장",
        "policy"
      )
    );
  }

  if (isCopyleftLicense(license.spdxId)) {
    items.push(
      buildChecklistItem(
        "copyleft-conditions-reviewed",
        "Copyleft 조건 확인",
        "GPL/AGPL 계열 조건이 배포 방식이나 네트워크 제공 방식에 영향을 주는지 확인합니다.",
        "필수",
        "policy"
      )
    );
  }

  if (license.spdxId === "UNKNOWN") {
    items.push(
      buildChecklistItem(
        "unknown-license-manual-review",
        "UNKNOWN 수동 판정",
        "대표 라이선스를 자동으로 확정하지 못했으므로 원문 기준 수동 판정을 기록합니다.",
        "필수",
        "review"
      )
    );
  }

  return items;
}

export function buildLicenseChecklistStorageKey({ runId, repo, analysis }) {
  // 같은 runId라도 저장소나 SPDX가 바뀌면 이전 체크 상태가 섞이지 않도록 키에 핵심 식별자를 포함합니다.
  const license = buildLicenseViewModel(analysis);
  const keyParts = [
    "ossdoc",
    "license-review-checklist",
    runId ?? "unknown-run",
    repo ?? "unknown-repo",
    license.spdxId ?? "UNKNOWN",
  ];

  return keyParts
    .join(":")
    .replace(/[^a-zA-Z0-9:_-]/g, "-")
    .slice(0, 180);
}

export function calculateChecklistProgress(items, checkedIds) {
  const total = items.length;
  const completed = items.filter((item) => checkedIds.has(item.id)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    remaining: Math.max(0, total - completed),
    percent,
  };
}
