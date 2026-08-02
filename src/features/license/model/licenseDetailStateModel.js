const ACTIVE_RUN_STATUSES = new Set([
  "QUEUED",
  "RUNNING",
  "PROCESSING",
  "STARTED",
]);

const FAILED_RUN_STATUSES = new Set([
  "FAILED",
  "ERROR",
  "CANCELED",
  "CANCELLED",
]);

const FINISHED_RUN_STATUSES = new Set([
  "COMPLETED",
  "COMPLETE",
  "DONE",
  "SUCCESS",
  "SUCCEEDED",
  ...FAILED_RUN_STATUSES,
]);

function normalizeStatus(status) {
  return String(status ?? "").trim().toUpperCase();
}

function licenseStepFailure(progress) {
  return progress?.failedSteps?.find((step) => step.stage === "LICENSE") ?? null;
}

export function hasRenderableLicenseAnalysis(analysis, loading, error) {
  return Boolean(analysis) && !loading && !error;
}

export function buildLicenseEmptyState({
  progress,
  progressLoading,
  progressError,
  artifactId,
}) {
  // 상세 페이지가 "기다리는 중", "실패", "산출물 누락"을 같은 빈 화면으로 보여주지 않도록 구분합니다.
  const status = normalizeStatus(progress?.status);
  const stepFailure = licenseStepFailure(progress);

  if (progressLoading) {
    return {
      tone: "info",
      title: "분석 진행 상태를 확인하는 중입니다.",
      description:
        "runId로 최신 진행 상태를 불러온 뒤 라이선스 산출물 위치를 확인합니다.",
      badge: "상태 확인 중",
    };
  }

  if (progressError) {
    return {
      tone: "warning",
      title: "분석 진행 상태 확인이 지연되고 있습니다.",
      description:
        "진행 상태 API 응답을 다시 확인하는 중입니다. 네트워크나 서버 상태를 확인한 뒤 잠시 후 새로고침해주세요.",
      badge: "상태 조회 실패",
    };
  }

  if (!progress) {
    return {
      tone: "info",
      title: "라이선스 산출물 정보를 기다리는 중입니다.",
      description:
        "아직 분석 진행 정보가 도착하지 않았습니다. runId가 올바르면 잠시 뒤 자동으로 갱신됩니다.",
      badge: "대기 중",
    };
  }

  if (stepFailure) {
    return {
      tone: "danger",
      title: "라이선스 분석 단계가 실패했습니다.",
      description:
        stepFailure.message ??
        "LICENSE 단계에서 오류가 발생해 대표 라이선스 산출물을 만들지 못했습니다.",
      badge: "LICENSE 실패",
    };
  }

  if (artifactId) {
    return {
      tone: "warning",
      title: "라이선스 산출물 내용을 확인할 수 없습니다.",
      description:
        "artifactId는 찾았지만 산출물 내용이 비어 있거나 아직 내려오지 않았습니다.",
      badge: "내용 없음",
    };
  }

  if (ACTIVE_RUN_STATUSES.has(status)) {
    return {
      tone: "info",
      title: "대표 라이선스 산출물을 생성하는 중입니다.",
      description:
        "분석 파이프라인이 아직 실행 중입니다. LICENSE 단계가 완료되면 상세 결과가 표시됩니다.",
      badge: status || "진행 중",
    };
  }

  if (FAILED_RUN_STATUSES.has(status)) {
    return {
      tone: "danger",
      title: "분석 실행이 실패해 라이선스 산출물이 없습니다.",
      description:
        "전체 분석 run이 실패 상태입니다. 분석 결과 페이지에서 실패 원인을 먼저 확인해주세요.",
      badge: status,
    };
  }

  if (FINISHED_RUN_STATUSES.has(status)) {
    return {
      tone: "warning",
      title: "완료된 분석에서 라이선스 산출물을 찾지 못했습니다.",
      description:
        "progress 응답에 대표 라이선스 artifactId가 없습니다. 백엔드 연결 필드나 LICENSE 단계 산출물 저장 여부를 확인해야 합니다.",
      badge: "artifact 없음",
    };
  }

  return {
    tone: "info",
    title: "대표 라이선스 산출물을 기다리는 중입니다.",
    description:
      "진행 상태가 갱신되면 라이선스 상세 결과가 자동으로 표시됩니다.",
    badge: status || "대기 중",
  };
}
