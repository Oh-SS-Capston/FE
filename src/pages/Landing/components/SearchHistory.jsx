import { History, Trash2 } from "lucide-react";

export default function SearchHistory({ items, onClickItem, onClear }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <History size={24} className="text-cyan-300" />
          </div>
          <h3 className="truncate text-2xl font-bold tracking-wide">Recent Explorations</h3>
        </div>

        <button
          onClick={onClear}
          className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl text-gray-500">
          아직 검색 기록이 없어요. 레포를 분석해보세요!
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((repo) => (
            <button
              key={repo}
              onClick={() => onClickItem(repo)}
              className="group w-full min-w-0 text-left p-5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/20 transition-all flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            >
              <span className="min-w-0 truncate text-lg text-gray-400 group-hover:text-white transition-colors font-medium">
                {repo}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
