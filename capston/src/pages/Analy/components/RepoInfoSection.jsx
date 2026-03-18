import { Github } from "lucide-react";

export default function RepoInfoSection({ repo, info, loading, error }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-4/5" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-500/30 bg-[#0a0a1a]/60 p-8 text-red-200">
        레포 정보를 가져오지 못했습니다: {String(error)}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Github size={18} className="text-purple-300" />
            <h2 className="text-2xl font-bold">{repo}</h2>
          </div>

          {info?.description && <p className="text-white/70">{info.description}</p>}

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {info?.language && (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1">
                {info.language}
              </span>
            )}
            {typeof info?.stargazers_count === "number" && (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1">
                ⭐ {info.stargazers_count}
              </span>
            )}
            {typeof info?.forks_count === "number" && (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1">
                🍴 {info.forks_count}
              </span>
            )}
            {info?.license?.spdx_id && (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1">
                📄 {info.license.spdx_id}
              </span>
            )}
          </div>
        </div>

        {info?.html_url && (
          <a
            href={info.html_url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            GitHub 열기
          </a>
        )}
      </div>
    </section>
  );
}