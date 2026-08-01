import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  FileJson,
  FileText,
  Share2,
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
      className="group rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition group-hover:border-cyan-300/45">
          <Icon size={18} />
        </span>

        <span className="min-w-0">
          <span className="block font-black text-slate-100">{label}</span>
          <span className="mt-1 block text-sm leading-5 text-gray-500">
            {description}
          </span>
        </span>
      </div>
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
    <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080817]/75 shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-transparent via-sky-300/45 to-transparent" />

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-100">
              <Share2 size={14} />
              Report Actions
            </div>

            <h3 className="mt-4 text-2xl font-black text-white">
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

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
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
