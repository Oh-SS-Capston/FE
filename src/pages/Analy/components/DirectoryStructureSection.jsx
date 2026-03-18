import { FolderOpen, Box, ChevronDown } from "lucide-react";

export default function DirectoryStructureSection({
  tree,
  loading,
  error,
  expanded,
  onToggle,
}) {
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
      <div className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-4">
          <FolderOpen size={22} className="text-cyan-400" />
          Directory Structure
        </h3>

        {loading && (
          <div className="text-gray-500 text-sm animate-pulse">로딩 중...</div>
        )}
        {error && (
          <div className="text-red-400 text-sm">디렉토리를 불러오지 못했습니다.</div>
        )}

        {!loading && !error && (
          <ul className="space-y-2">
            {tree.map((item) => {
              const isDir = item.type === "dir";
              const isOpen = expanded[item.path];

              return (
                <li
                  key={item.path}
                  className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <button
                    onClick={() => isDir && onToggle(item.path)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {isDir ? (
                        <ChevronDown
                          size={16}
                          className={`text-gray-500 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      {isDir ? (
                        <FolderOpen size={16} className="text-cyan-400/80 shrink-0" />
                      ) : (
                        <Box size={16} className="text-white/50 shrink-0" />
                      )}
                      {item.name}
                    </span>
                  </button>

                  {isDir && isOpen && item.children?.length > 0 && (
                    <ul className="border-t border-white/5 bg-black/20 divide-y divide-white/5">
                      {item.children.map((c) => (
                        <li
                          key={c.path}
                          className="px-4 py-2.5 pl-12 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors flex items-center gap-2"
                        >
                          {c.type === "dir" ? (
                            <FolderOpen size={14} className="text-cyan-400/70 shrink-0" />
                          ) : (
                            <Box size={14} className="text-purple-400/70 shrink-0" />
                          )}
                          <span className="text-sm">{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
