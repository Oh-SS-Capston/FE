import { apiClient } from "../../../shared/api/client";

export function createRepoRun({ repoUrl, ref }) {
  return apiClient("/api/v1/runs", {
    method: "POST",
    body: {
      repoUrl,
      ref: ref || null,
    },
  });
}

/*
 * Analyze 페이지에서 분석 진행 상태를 polling하는 API입니다.
 */
export function getRunProgress(runId) {
  return apiClient(`/api/v1/runs/${encodeURIComponent(runId)}/progress`, {
    method: "GET",
  });
}

/*
 * class_diagram.json 같은 artifact JSON을 조회하는 API입니다.
 */
export function getArtifactJson(artifactId) {
  return apiClient(`/api/v1/artifacts/${encodeURIComponent(artifactId)}`, {
    method: "GET",
  });
}