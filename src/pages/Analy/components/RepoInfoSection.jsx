import { Github } from "lucide-react";

export default function RepoInfoSection({ repo, info, loading, error }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="flex gap-4 mt-2">
            <div className="h-6 bg-white/5 rounded w-24" />
            <div className="h-6 bg-white/5 rounded w-20" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
        <p className="text-red-400">{error}</p>
        <p className="text-gray-500 text-sm mt-2">레포지토리 URL을 확인하거나 나중에 다시 시도해 주세요.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      {/* 상단 글로우 라인 */}
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
        }}
      />
      <div className="p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Github size={24} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent truncate">
                {info?.full_name ?? repo}
              </h2>
            </div>

            {info?.description && (
              <p className="text-gray-400 mt-2 line-clamp-2">{info.description}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-5 text-sm">
              {info?.language && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-gray-400">
                  {info.language}
                </span>
              )}
              {typeof info?.stargazers_count === "number" && (
                <span className="text-gray-500">
                  <span className="text-cyan-400 font-medium">
                    {info.stargazers_count.toLocaleString()}
                  </span>{" "}
                  stars
                </span>
              )}
              {typeof info?.forks_count === "number" && (
                <span className="text-gray-500">
                  <span className="text-purple-400 font-medium">
                    {info.forks_count.toLocaleString()}
                  </span>{" "}
                  forks
                </span>
              )}
              {info?.license?.spdx_id && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-gray-400">
                  {info.license.spdx_id}
                </span>
              )}
            </div>
          </div>

          {info?.html_url && (
            <a
              href={info.html_url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              GitHub에서 보기 →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
