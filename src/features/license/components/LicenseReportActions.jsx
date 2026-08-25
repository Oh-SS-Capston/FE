import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  FileJson,
  FileText,
} from "lucide-react";
import {
  buildLicenseReportFilename,
  buildLicenseReportJson,
  buildLicenseReportMarkdown,
} from "../model/licenseReportModel";

const STATUS_CLEAR_DELAY_MS = 2400;

function downloadTextFile({ filename, content, mimeType }) {
  // 백엔드 호출 없이 현재 브라우저 메모리의 문자열을 다운로드 파일로 만들어줍니다.
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  try {
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

function ActionButton({ icon: Icon, label, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-[var(--surface-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon size={16} className="shrink-0 text-cyan-100" />
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block truncate text-xs text-gray-500">
          {description}
        </span>
      </span>
    </button>
  );
}

export default function LicenseReportActions({ analysis, runId, repo }) {
  const [status, setStatus] = useState({ message: "", tone: "success" });
  const disabled = !analysis;

  const markdown = useMemo(() => {
    if (!analysis) {
      return "";
    }

    return buildLicenseReportMarkdown(analysis, { runId, repo });
  }, [analysis, repo, runId]);

  const jsonText = useMemo(() => {
    if (!analysis) {
      return "";
    }

    return JSON.stringify(
      buildLicenseReportJson(analysis, { runId, repo }),
      null,
      2
    );
  }, [analysis, repo, runId]);

  const showTemporaryStatus = (message, tone = "success") => {
    setStatus({ message, tone });
    window.setTimeout(
      () => setStatus({ message: "", tone: "success" }),
      STATUS_CLEAR_DELAY_MS
    );
  };

  const copyMarkdownReport = async () => {
    if (disabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      showTemporaryStatus("Markdown 요약을 복사했습니다.");
    } catch {
      showTemporaryStatus("브라우저 클립보드 권한을 확인해주세요.", "warning");
    }
  };

  const downloadMarkdownReport = () => {
    if (disabled) {
      return;
    }

    downloadTextFile({
      filename: buildLicenseReportFilename(runId, "md"),
      content: markdown,
      mimeType: "text/markdown;charset=utf-8",
    });
    showTemporaryStatus("Markdown 파일을 생성했습니다.");
  };

  const downloadJsonReport = () => {
    if (disabled) {
      return;
    }

    downloadTextFile({
      filename: buildLicenseReportFilename(runId, "json"),
      content: jsonText,
      mimeType: "application/json;charset=utf-8",
    });
    showTemporaryStatus("JSON 파일을 생성했습니다.");
  };

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              리포트 액션
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              대표 라이선스 결과를 리뷰 문서에 붙이거나 산출물 파일로 보관합니다.
            </p>
          </div>

          {status.message && (
            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                status.tone === "warning"
                  ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
                  : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
              }`}
            >
              {status.tone === "warning" ? (
                <AlertTriangle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {status.message}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionButton
            icon={Clipboard}
            label="Markdown 복사"
            description="이슈나 PR에 붙일 요약"
            onClick={copyMarkdownReport}
            disabled={disabled}
          />
          <ActionButton
            icon={FileText}
            label="Markdown 다운로드"
            description="검토 기록용 텍스트 파일"
            onClick={downloadMarkdownReport}
            disabled={disabled}
          />
          <ActionButton
            icon={FileJson}
            label="JSON 다운로드"
            description="원본 산출물 포함 데이터"
            onClick={downloadJsonReport}
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  );
}
