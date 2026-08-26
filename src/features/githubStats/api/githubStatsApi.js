import { apiClient } from "../../../shared/api/client";

export function getGithubStats(runId, { forceRefresh = false } = {}) {
  const query = new URLSearchParams();

  if (forceRefresh) {
    query.set("forceRefresh", "true");
  }

  const queryString = query.toString();

  return apiClient(
    `/api/v1/runs/${encodeURIComponent(runId)}/github-stats${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
    }
  );
}