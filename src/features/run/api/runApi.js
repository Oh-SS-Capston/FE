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

export function getRecentRuns() {
  return apiClient("/api/v1/runs/recent", {
    method: "GET",
  });
}

export function getRunProgress(runId) {
  return apiClient(`/api/v1/runs/${runId}/progress`);
}

export function getArtifactJson(artifactId) {
  return apiClient(`/api/v1/artifacts/${artifactId}`);
}