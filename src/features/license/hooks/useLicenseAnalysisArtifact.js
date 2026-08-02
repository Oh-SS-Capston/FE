import { useEffect, useMemo, useState } from "react";
import { getArtifactContent } from "../../run/api/runApi";
import {
  getLicenseStepFailure,
  resolveLicenseAnalysisArtifactId,
} from "../model/licenseArtifactResolver";

const INITIAL_STATE = {
  analysis: null,
  loading: false,
  error: null,
};

/**
 * 대표 라이선스 산출물의 ID 탐색과 네트워크 로딩을 담당하는 hook입니다.
 * 화면 컴포넌트는 이 hook의 결과만 받아 그리기만 하도록 책임을 분리합니다.
 */
export function useLicenseAnalysisArtifact(progress, runId) {
  const artifactId = useMemo(
    () => resolveLicenseAnalysisArtifactId(progress),
    [progress]
  );
  const stepFailure = useMemo(() => getLicenseStepFailure(progress), [progress]);
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    setState(INITIAL_STATE);
  }, [runId]);

  useEffect(() => {
    if (!runId) {
      return;
    }

    if (!artifactId) {
      if (stepFailure?.message) {
        setState({
          analysis: null,
          loading: false,
          error: stepFailure.message,
        });
      }
      return;
    }

    let cancelled = false;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    getArtifactContent(artifactId)
      .then((content) => {
        if (cancelled) {
          return;
        }

        if (content == null) {
          setState({
            analysis: null,
            loading: false,
            error: "라이선스 분석 산출물 내용이 비어 있습니다.",
          });
          return;
        }

        setState({
          analysis: content,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setState({
          analysis: null,
          loading: false,
          error:
            error?.message ?? "라이선스 분석 산출물을 불러오지 못했습니다.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [artifactId, runId, stepFailure?.message]);

  return {
    artifactId,
    analysis: state.analysis,
    loading: state.loading,
    error: state.error,
  };
}
