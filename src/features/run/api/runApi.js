import { apiClient } from "../../../shared/api/client";
import { formatUserErrorMessage } from "../../../shared/lib/userErrorMessage";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unwrapApiEnvelope(payload) {
  if (!isRecord(payload)) {
    return payload;
  }

  if ("result" in payload && payload.result != null) {
    return payload.result;
  }

  if ("data" in payload && payload.data != null) {
    return payload.data;
  }

  return payload;
}

function toArtifactId(value) {
  if (value == null) {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function createRepoRun({
  repoUrl,
  ref,
  forceRebuild = false,
  llmProvider,
}) {
  const body = {
    repoUrl,
    ref: ref || null,
  };

  if (forceRebuild) {
    body.forceRebuild = true;
  }

  /*
   * llmProvider("claude" | "ollama")는 선택 필드입니다.
   * 값이 없으면 아예 보내지 않고 서버 설정(ossdoc.llm.provider)을 따릅니다.
   */
  const provider = String(llmProvider ?? "").trim();

  if (provider) {
    body.llmProvider = provider;
  }

  return apiClient("/api/v1/runs", {
    method: "POST",
    body,
  });
}

export function getRecentRuns() {
  return apiClient("/api/v1/runs/recent", {
    method: "GET",
  });
}

export function getRunProgress(runId) {
  return apiClient(`/api/v1/runs/${runId}/progress`, {
    method: "GET",
  });
}

export function getArtifactJson(artifactId) {
  return apiClient(`/api/v1/artifacts/${artifactId}`, {
    method: "GET",
  });
}

/**
 * artifact 응답(메타+content)에서 content만 꺼냄.
 */
export async function getArtifactContent(artifactId) {
  const raw = await getArtifactJson(artifactId);
  const artifact = unwrapApiEnvelope(raw);

  if (!isRecord(artifact)) {
    return null;
  }

  if ("content" in artifact) {
    return artifact.content;
  }

  return artifact;
}

/**
 * runId 기준으로 LLM 4종 산출물 + refined_rules를 한번에 가져옴.
 * 반환값:
 * {
 *   runId,
 *   artifactIds,
 *   refinedRules,
 *   scenarioSpecs,
 *   subsystemSummaries,
 *   apiDocs,
 *   fileTreeDocs,
 *   _meta: { scenarioSpecs, ... } // artifact 원본 메타
 * }
 */
export async function getRunLlmResults(runId) {
  const progressRaw = await getRunProgress(runId);
  const progress = unwrapApiEnvelope(progressRaw);
  const artifacts = isRecord(progress) ? progress.artifacts || {} : {};

  const mapping = [
    {
      idField: "llmRefinedRulesArtifactId",
      resultField: "refinedRules",
      metaField: "refinedRules",
    },
    {
      idField: "llmScenarioSpecsArtifactId",
      resultField: "scenarioSpecs",
      metaField: "scenarioSpecs",
    },
    {
      idField: "llmSubsystemSummariesArtifactId",
      resultField: "subsystemSummaries",
      metaField: "subsystemSummaries",
    },
    {
      idField: "llmApiDocsArtifactId",
      resultField: "apiDocs",
      metaField: "apiDocs",
    },
    {
      idField: "llmFileTreeDocsArtifactId",
      resultField: "fileTreeDocs",
      metaField: "fileTreeDocs",
    },
  ];

  const output = {
    runId,
    artifactIds: artifacts,
    refinedRules: null,
    scenarioSpecs: null,
    subsystemSummaries: null,
    apiDocs: null,
    fileTreeDocs: null,
    _meta: {},
  };

  await Promise.all(
    mapping.map(async ({ idField, resultField, metaField }) => {
      const artifactId = toArtifactId(artifacts?.[idField]);

      if (!artifactId) {
        output[resultField] = null;
        output._meta[metaField] = null;
        return;
      }

      try {
        const raw = await getArtifactJson(artifactId);
        const artifact = unwrapApiEnvelope(raw);

        output._meta[metaField] = artifact || null;
        output[resultField] =
          isRecord(artifact) && "content" in artifact
            ? artifact.content
            : artifact || null;
      } catch (e) {
        output[resultField] = null;
        output._meta[metaField] = {
          artifactId,
          error: formatUserErrorMessage(e, "artifact fetch failed"),
        };
      }
    })
  );

  return output;
}
