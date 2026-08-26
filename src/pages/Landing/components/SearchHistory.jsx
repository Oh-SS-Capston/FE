import { Clock3, History } from "lucide-react";
import Badge from "../../../shared/components/ui/Badge";

function getRepoLabel(item) {
  if (typeof item === "string") {
    return item;
  }

  return item.repoFullName || item.repoUrl || item.repoName || "";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function statusClassName(status) {
  switch (status) {
    case "SUCCESS":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "PARTIAL_SUCCESS":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
    case "FAILED":
      return "border-red-400/20 bg-red-400/10 text-red-200";
    case "RUNNING":
    case "QUEUED":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    default:
      return "border-white/10 bg-white/[0.04] text-gray-400";
  }
}

export default function SearchHistory({
  items = [],
  authenticated = false,
  loading = false,
  onClickItem,
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2">
            <History size={24} className="text-cyan-300" />
          </div>

          <h3 className="truncate text-2xl font-semibold tracking-wide">
            최근 분석
          </h3>
        </div>
      </div>

      {!authenticated ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-gray-500">
          로그인 후 사용자별 분석 기록을 확인할 수 있습니다.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-gray-500">
          최근 분석 기록을 불러오는 중입니다.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-gray-500">
          아직 분석 기록이 없습니다. 레포지토리를 분석해보세요.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const repoLabel = getRepoLabel(item);
            const key =
              typeof item === "string"
                ? item
                : item.runId || item.repoFullName || item.repoUrl;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onClickItem(item)}
                className="group flex w-full min-w-0 items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="min-w-0">
                  <p className="min-w-0 truncate text-lg text-gray-300 group-hover:text-white transition-colors font-medium">
                    {repoLabel}
                  </p>

                  {typeof item !== "string" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.status && (
                        <Badge
                          className={statusClassName(
                            item.status
                          )}
                        >
                          {item.status}
                        </Badge>
                      )}

                      {item.createdAt && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Clock3 size={12} />
                          {formatDate(item.createdAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <span className="shrink-0 text-sm text-gray-500 group-hover:text-cyan-200 transition-colors">
                  보기
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
