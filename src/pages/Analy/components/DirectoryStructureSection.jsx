import { FolderOpen, Box, ChevronDown } from "lucide-react";

export default function DirectoryStructureSection({
  tree,
  loading,
  error,
  expanded,
  onToggle,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl p-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FolderOpen size={18} className="text-cyan-200" />
        Directory Structure
      </h3>

      {loading && <div className="text-white/70">로딩 중...</div>}
      {error && <div className="text-red-200">디렉토리를 불러오지 못했습니다.</div>}

      {!loading && !error && (
        <div className="space-y-2">
          {tree.map((item) => {
            const isDir = item.type === "dir";
            const isOpen = expanded[item.path];

            return (
              <div key={item.path} className="rounded-xl border border-white/10 bg-white/5">
                <button
                  onClick={() => isDir && onToggle(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    {isDir ? (
                      <FolderOpen size={16} className="text-purple-200" />
                    ) : (
                      <Box size={16} className="text-white/60" />
                    )}
                    <span>{item.name}</span>
                  </div>

                  {isDir && (
                    <ChevronDown
                      size={16}
                      className={`text-white/60 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {/* children */}
                {isDir && isOpen && item.children?.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="ml-6 border-l border-white/10 pl-4 space-y-1">
                      {item.children.map((c) => (
                        <div key={c.path} className="flex items-center gap-2 py-1 text-sm text-white/80">
                          {c.type === "dir" ? (
                            <FolderOpen size={14} className="text-cyan-200" />
                          ) : (
                            <Box size={14} className="text-white/50" />
                          )}
                          <span>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}