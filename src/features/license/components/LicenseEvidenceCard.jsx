import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileCode2,
} from "lucide-react";
import {
  buildLicenseEvidenceCopyText,
  buildLicenseEvidenceViewModel,
} from "../model/licenseEvidenceModel";

const SNIPPET_PREVIEW_LENGTH = 320;
const STATUS_CLEAR_DELAY_MS = 1800;

function EvidenceActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-[var(--surface-hover)] hover:text-cyan-100"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

export default function LicenseEvidenceCard({ evidence, index }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState({ message: "", tone: "success" });
  const viewModel = useMemo(
    () => buildLicenseEvidenceViewModel(evidence, index),
    [evidence, index]
  );
  const copyText = useMemo(
    () => buildLicenseEvidenceCopyText(evidence, index),
    [evidence, index]
  );
  const canExpandSnippet = viewModel.snippet.length > SNIPPET_PREVIEW_LENGTH;
  const displayedSnippet =
    canExpandSnippet && !expanded
      ? `${viewModel.snippet.slice(0, SNIPPET_PREVIEW_LENGTH).trimEnd()}...`
      : viewModel.snippet;

  const showTemporaryStatus = (message, tone = "success") => {
    setStatus({ message, tone });
    window.setTimeout(
      () => setStatus({ message: "", tone: "success" }),
      STATUS_CLEAR_DELAY_MS
    );
  };

  const copyToClipboard = async (value, successMessage) => {
    // 근거 검토 중 자주 필요한 파일 경로와 snippet을 브라우저 클립보드로 복사합니다.
    try {
      await navigator.clipboard.writeText(value);
      showTemporaryStatus(successMessage);
    } catch {
      showTemporaryStatus("클립보드 권한을 확인해주세요.", "warning");
    }
  };

  return (
    <article className="border-t border-[var(--border)] py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="font-semibold text-cyan-100">
              {viewModel.evidenceId}
            </span>
            <span>
              {viewModel.source}
            </span>
            <span>
              {viewModel.type}
            </span>
          </div>

          <p className="mt-3 break-all font-mono text-sm text-slate-100">
            {viewModel.path}
          </p>
        </div>

        <span className="shrink-0 text-xs font-semibold text-gray-400">
          {viewModel.lineLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EvidenceActionButton
          icon={Copy}
          label="경로 복사"
          onClick={() => copyToClipboard(viewModel.path, "경로를 복사했습니다.")}
        />
        <EvidenceActionButton
          icon={FileCode2}
          label="근거 복사"
          onClick={() => copyToClipboard(copyText, "근거를 복사했습니다.")}
        />

        {status.message && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              status.tone === "warning"
                ? "text-amber-100"
                : "text-emerald-100"
            }`}
          >
            {status.tone === "warning" ? (
              <AlertTriangle size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {status.message}
          </span>
        )}
      </div>

      {viewModel.snippet && (
        <div className="mt-3">
          <blockquote className="whitespace-pre-wrap font-mono text-xs leading-6 text-gray-400">
            {displayedSnippet}
          </blockquote>

          {canExpandSnippet && (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-[var(--surface-hover)]"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "접기" : "전체 보기"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
