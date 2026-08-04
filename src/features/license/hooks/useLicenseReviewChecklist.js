import { useCallback, useEffect, useMemo, useState } from "react";

function readStoredCheckedIds(storageKey) {
  if (!storageKey) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCheckedIds(storageKey, checkedIds) {
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(checkedIds));
  } catch {
    // 브라우저 저장소가 비활성화된 환경에서는 현재 화면 상태만 유지합니다.
  }
}

export function useLicenseReviewChecklist(storageKey, items) {
  const validItemIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const [state, setState] = useState(() => ({
    storageKey,
    checkedIds: readStoredCheckedIds(storageKey).filter((id) =>
      validItemIds.has(id)
    ),
  }));

  useEffect(() => {
    // runId/SPDX가 바뀌면 해당 분석 결과에 맞는 체크 상태를 다시 불러옵니다.
    setState({
      storageKey,
      checkedIds: readStoredCheckedIds(storageKey).filter((id) =>
        validItemIds.has(id)
      ),
    });
  }, [storageKey, validItemIds]);

  useEffect(() => {
    if (state.storageKey === storageKey) {
      writeStoredCheckedIds(storageKey, state.checkedIds);
    }
  }, [state, storageKey]);

  const checkedIdSet = useMemo(() => new Set(state.checkedIds), [state.checkedIds]);

  const toggleItem = useCallback(
    (itemId) => {
      if (!validItemIds.has(itemId)) {
        return;
      }

      setState((current) => ({
        storageKey,
        checkedIds: current.checkedIds.includes(itemId)
          ? current.checkedIds.filter((id) => id !== itemId)
          : [...current.checkedIds, itemId],
      }));
    },
    [storageKey, validItemIds]
  );

  const resetChecklist = useCallback(() => {
    setState({ storageKey, checkedIds: [] });
  }, [storageKey]);

  return {
    checkedIds: checkedIdSet,
    toggleItem,
    resetChecklist,
  };
}
