const KEY = "ohss_search_history";

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistory(repo) {
  const prev = getHistory();
  const next = [repo, ...prev.filter((x) => x !== repo)].slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function removeHistory(repo) {
  const prev = getHistory();
  const next = prev.filter((x) => x !== repo);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}