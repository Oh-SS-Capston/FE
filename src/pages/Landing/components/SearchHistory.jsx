import { History, Trash2 } from "lucide-react";

export default function SearchHistory({ items, onClickItem, onClear }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <History size={24} className="text-cyan-300" />
          </div>
          <h3 className="text-2xl font-bold tracking-wide text-white">
            Recent Explorations
          </h3>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 p-6 text-white/70">
          아직 검색 기록이 없어요. 레포를 분석해보세요!
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((repo) => (
            <button
              key={repo}
              onClick={() => onClickItem(repo)}
              className="w-full text-left rounded-2xl border border-white/10 bg-[#0a0a1a]/60 p-4 text-white hover:border-purple-400/40 hover:bg-[#0a0a1a]/80 transition"
            >
              {repo}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}