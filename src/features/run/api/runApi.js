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