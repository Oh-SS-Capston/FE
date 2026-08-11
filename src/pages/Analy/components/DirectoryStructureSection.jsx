import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  GitCommitHorizontal,
  Loader2,
} from "lucide-react";
import { FileTreeDocsPanel } from "./LlmResultSection";

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
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-white/5 hover:text-white"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown size={16} className="shrink-0 text-gray-400" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-gray-400" />
          )}

          <Folder size={16} className="shrink-0 text-cyan-300/90" />
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
                className="px-3 py-2 text-xs text-gray-500"
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
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-400"
      style={{ paddingLeft }}
    >
      <span className="w-4 shrink-0" />
      <FileText size={15} className="shrink-0 text-gray-400" />
      <span className="min-w-0 truncate">{node.name}</span>
    </div>
  );
}

function PanelHeader({ title, description, badge }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
      <div>
        <h3 className="font-bold text-gray-100">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-gray-400">{description}</p>
      </div>
      {badge}
    </div>
  );
}

export default function DirectoryStructureSection({
  tree,
  loading,
  error,
  expanded,
  onToggle,
  commitSha,
  fileTreeDocs,
  docsLoading = false,
  docsError = null,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <h2 className="text-xl font-bold text-white">코드 탐색</h2>
        <p className="mt-1 text-sm leading-6 text-gray-400">
          분석에 사용된 동일 Commit의 디렉토리와 LLM 파일 설명을 한 화면에서 확인합니다.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <PanelHeader
            title="Commit 디렉토리"
            description="GitHub 최신 브랜치가 아닌 분석 Snapshot 기준 구조입니다."
            badge={
              <span
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-100"
                title={commitSha ?? ""}
              >
                <GitCommitHorizontal size={14} className="shrink-0" />
                {commitSha ? commitSha.slice(0, 12) : "SHA 확인 중"}
              </span>
            }
          />

          <div className="max-h-[680px] overflow-auto p-3">
            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-gray-300">
                <Loader2 size={16} className="animate-spin" />
                {commitSha
                  ? "Commit 기준 디렉토리를 불러오는 중입니다."
                  : "분석 Commit SHA를 확인하는 중입니다."}
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {!loading && !error && (!tree || tree.length === 0) && (
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-gray-400">
                {commitSha
                  ? "표시할 디렉토리 구조가 없습니다."
                  : "Commit SHA가 확인되면 디렉토리를 조회합니다."}
              </div>
            )}

            {!loading && !error && tree?.length > 0 && (
              <div>
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
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <PanelHeader
            title="파일 분석 문서"
            description="파일·클래스·메서드 역할과 연결된 코드 근거를 확인합니다."
          />

          <div className="max-h-[680px] overflow-auto p-4">
            {docsLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-gray-300">
                <Loader2 size={16} className="animate-spin" />
                파일 분석 문서를 불러오는 중입니다.
              </div>
            )}

            {!docsLoading && docsError && !fileTreeDocs && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-200">
                {docsError}
              </div>
            )}

            {!docsLoading && (fileTreeDocs || !docsError) && (
              <FileTreeDocsPanel data={fileTreeDocs} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
