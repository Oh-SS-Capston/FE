function appendQueryParam(query, key, value) {
  if (value) {
    query.set(key, value);
  }
}

export function buildLicenseAnalysisPath({ runId, repo }) {
  const query = new URLSearchParams();
  appendQueryParam(query, "runId", runId);
  appendQueryParam(query, "repo", repo);
  return `/license-analysis?${query.toString()}`;
}

export function buildAnalyzePath({ runId, repo }) {
  const query = new URLSearchParams();
  appendQueryParam(query, "runId", runId);
  appendQueryParam(query, "repo", repo);
  return `/analyze?${query.toString()}`;
}
