import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";

function TreeNode({ node, depth, expanded, onToggle }) {
  const isDirectory = node.type === "dir";
  const isExpanded = Boolean(expanded[node.path]);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  const paddingLeft = 12 + depth * 18;

  if (isDirectory) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown size={16} className="shrink-0 text-gray-500" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-gray-500" />
          )}

          <Folder size={16} className="shrink-0 text-cyan-300/80" />

          <span className="min-w-0 truncate font-medium">{node.name}</span>
        </button>

        {isExpanded && (
          <div className="mt-1">
            {hasChildren ? (
              node.children.map((child) => (
                <TreeNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              ))
            ) : (
              <div
                className="px-3 py-2 text-xs text-gray-600"
                style={{ paddingLeft: 12 + (depth + 1) * 18 }}
              >
                하위 항목을 불러오는 중이거나 비어 있습니다.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500"
      style={{ paddingLeft }}
    >
      <span className="w-4 shrink-0" />
      <FileText size={15} className="shrink-0 text-gray-500" />
      <span className="min-w-0 truncate">{node.name}</span>
    </div>
  );
}

export default function DirectoryStructureSection({
  tree,
  loading,
  error,
  expanded,
  onToggle,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Directory Structure</h2>
          <p className="mt-1 text-sm text-gray-500">
            GitHub 레포지토리의 디렉토리 구조입니다.
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-400">
          디렉토리 구조를 불러오는 중입니다.
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-5 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (!tree || tree.length === 0) && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-500">
          표시할 디렉토리 구조가 없습니다.
        </div>
      )}

      {!loading && !error && tree?.length > 0 && (
        <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}