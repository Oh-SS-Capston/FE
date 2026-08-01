import { pickFirst } from "../model/licenseAnalysisModel";

export default function LicenseEvidenceCard({ evidence, index }) {
  const evidenceId = pickFirst(
    evidence,
    ["evidenceId", "id"],
    `evidence-${index + 1}`
  );
  const path = pickFirst(
    evidence,
    ["path", "filePath", "file_path"],
    "unknown path"
  );
  const startLine = pickFirst(evidence, ["startLine", "start_line"], null);
  const endLine = pickFirst(evidence, ["endLine", "end_line"], null);
  const source = pickFirst(
    evidence,
    ["source", "sourceType", "source_type"],
    "ROOT_FILE"
  );
  const type = pickFirst(
    evidence,
    ["evidenceType", "evidence_type", "type"],
    "LICENSE_EVIDENCE"
  );
  const snippet = pickFirst(
    evidence,
    ["snippet", "contextSnippet", "context_snippet"],
    ""
  );

  const lineLabel =
    startLine && endLine
      ? startLine === endLine
        ? `L${startLine}`
        : `L${startLine}-L${endLine}`
      : "line -";

  return (
    <article className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100">
              {evidenceId}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-gray-300">
              {source}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-gray-400">
              {type}
            </span>
          </div>

          <p className="mt-3 break-all font-mono text-sm text-slate-100">
            {path}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-gray-300">
          {lineLabel}
        </span>
      </div>

      {snippet && (
        <blockquote className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-gray-300">
          {snippet}
        </blockquote>
      )}
    </article>
  );
}
