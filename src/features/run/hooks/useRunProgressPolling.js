import { useEffect, useState } from "react";
import { getRunProgress } from "../api/runApi";

function isActiveStatus(status) {
  return status === "QUEUED" || status === "RUNNING";
}

/**
 * runId 기준 진행 상태를 주기적으로 조회하는 공통 hook입니다.
 * 각 페이지가 polling 타이머, 취소 처리, 에러 상태를 직접 들고 있지 않게 분리합니다.
 */
export function useRunProgressPolling(runId, options = {}) {
  const { intervalMs = 1500, retryIntervalMs = 3000 } = options;
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!runId) {
      setProgress(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let timerId = null;

    setProgress(null);
    setLoading(true);
    setError(null);

    const poll = async () => {
      try {
        const nextProgress = await getRunProgress(runId);

        if (cancelled) {
          return;
        }

        setProgress(nextProgress);
        setError(null);
        setLoading(false);

        if (isActiveStatus(nextProgress?.status)) {
          timerId = window.setTimeout(poll, intervalMs);
        }
      } catch (e) {
        if (cancelled) {
          return;
        }

        setError(e?.message ?? "분석 진행 상태를 불러오지 못했습니다.");
        setLoading(false);
        timerId = window.setTimeout(poll, retryIntervalMs);
      }
    };

    poll();

    return () => {
      cancelled = true;

      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [intervalMs, retryIntervalMs, runId]);

  return {
    progress,
    loading,
    error,
  };
}
