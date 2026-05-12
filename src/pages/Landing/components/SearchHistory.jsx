import { Clock3, History } from "lucide-react";

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
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <History size={24} className="text-cyan-300" />
          </div>

          <h3 className="truncate text-2xl font-bold tracking-wide">
            Recent Explorations
          </h3>
        </div>
      </div>

      {!authenticated ? (
        <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl text-gray-500">
          로그인 후 사용자별 분석 기록을 확인할 수 있습니다.
        </div>
      ) : loading ? (
        <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl text-gray-500">
          최근 분석 기록을 불러오는 중입니다.
        </div>
      ) : items.length === 0 ? (
        <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl text-gray-500">
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
                className="group w-full min-w-0 text-left p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/20 transition-all flex justify-between items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                <div className="min-w-0">
                  <p className="min-w-0 truncate text-lg text-gray-300 group-hover:text-white transition-colors font-medium">
                    {repoLabel}
                  </p>

                  {typeof item !== "string" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.status && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClassName(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
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