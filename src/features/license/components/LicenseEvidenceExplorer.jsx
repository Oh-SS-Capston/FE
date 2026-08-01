import { useMemo, useState } from "react";
import {
  AlertTriangle,
  FileSearch,
  Filter,
  ListChecks,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  buildLicenseViewModel,
  pickFirst,
  safeArray,
} from "../model/licenseAnalysisModel";
import LicenseEvidenceCard from "./LicenseEvidenceCard";

const ALL_SOURCES = "ALL";

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function evidenceSource(evidence) {
  return pickFirst(
    evidence,
    ["source", "sourceType", "source_type"],
    "UNKNOWN_SOURCE"
  );
}

function evidenceSearchText(evidence) {
  return [
    pickFirst(evidence, ["evidenceId", "id"], ""),
    pickFirst(evidence, ["path", "filePath", "file_path"], ""),
    pickFirst(evidence, ["source", "sourceType", "source_type"], ""),
    pickFirst(evidence, ["evidenceType", "evidence_type", "type"], ""),
    pickFirst(evidence, ["snippet", "contextSnippet", "context_snippet"], ""),
  ]
    .map(normalizeText)
    .join(" ");
}

function buildSourceOptions(evidences) {
  const counts = new Map();

  evidences.forEach((evidence) => {
    const source = evidenceSource(evidence);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => a.source.localeCompare(b.source));
}

function ReviewDigest({ warnings, reviewItems }) {
  if (warnings.length === 0 && reviewItems.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-200" />
          <div>
            <p className="font-bold text-emerald-100">검토 경고가 없습니다.</p>
            <p className="mt-1 text-sm leading-6 text-emerald-50/70">
              현재 산출물 기준으로는 대표 라이선스 판단에 추가 경고가 없습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-200" />
        <div>
          <p className="font-bold text-amber-100">검토 포인트</p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-amber-50/80">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
            {reviewItems.map((item, index) => (
              <p key={`${pickFirst(item, ["type"], "review")}-${index}`}>
                {pickFirst(
                  item,
                  ["message", "description", "title", "type"],
                  "검토가 필요한 항목입니다."
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceFilterButton({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100"
          : "border-white/10 bg-white/[0.035] text-gray-400 hover:border-white/20 hover:text-white"
      }`}
    >
      {label}
      <span className="ml-2 text-[11px] opacity-70">{count}</span>
    </button>
  );
}

export default function LicenseEvidenceExplorer({ analysis }) {
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState(ALL_SOURCES);
  const license = useMemo(() => buildLicenseViewModel(analysis), [analysis]);
  const evidences = safeArray(license.evidences);

  const sourceOptions = useMemo(() => buildSourceOptions(evidences), [evidences]);
  const filteredEvidences = useMemo(() => {
    const normalizedQuery = normalizeText(query).trim();

    return evidences.filter((evidence) => {
      const sourceMatched =
        selectedSource === ALL_SOURCES || evidenceSource(evidence) === selectedSource;

      if (!sourceMatched) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return evidenceSearchText(evidence).includes(normalizedQuery);
    });
  }, [evidences, query, selectedSource]);

  if (!analysis) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080817]/75 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

      <div className="p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <FileSearch size={14} />
              Evidence Explorer
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              판단 근거 탐색
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              파일 경로, 근거 유형, 원문 일부를 기준으로 대표 라이선스 판단에
              사용된 증거를 빠르게 확인합니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Evidence
              </p>
              <p className="mt-2 text-2xl font-black text-cyan-100">
                {evidences.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Sources
              </p>
              <p className="mt-2 text-2xl font-black text-slate-100">
                {sourceOptions.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Review
              </p>
              <p
                className={`mt-2 text-2xl font-black ${
                  license.manualReviewRequired ? "text-amber-100" : "text-emerald-100"
                }`}
              >
                {license.manualReviewRequired ? "필요" : "통과"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-gray-300 focus-within:border-cyan-300/40">
              <Search size={17} className="shrink-0 text-cyan-200" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="파일명, SPDX, LICENSE, README, snippet 검색"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                <Filter size={13} />
                Source
              </span>
              <SourceFilterButton
                active={selectedSource === ALL_SOURCES}
                label="전체"
                count={evidences.length}
                onClick={() => setSelectedSource(ALL_SOURCES)}
              />
              {sourceOptions.map((option) => (
                <SourceFilterButton
                  key={option.source}
                  active={selectedSource === option.source}
                  label={option.source}
                  count={option.count}
                  onClick={() => setSelectedSource(option.source)}
                />
              ))}
            </div>
          </div>

          <ReviewDigest
            warnings={license.warnings}
            reviewItems={license.reviewItems}
          />
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-100">
              <ListChecks size={17} className="text-cyan-200" />
              검색 결과 {filteredEvidences.length}개
            </div>
          </div>

          {filteredEvidences.length > 0 ? (
            <div className="grid gap-3">
              {filteredEvidences.map((evidence, index) => (
                <LicenseEvidenceCard
                  key={pickFirst(
                    evidence,
                    ["evidenceId", "id"],
                    `filtered-evidence-${index}`
                  )}
                  evidence={evidence}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm leading-6 text-gray-500">
              조건에 맞는 근거가 없습니다. 검색어를 줄이거나 source 필터를
              전체로 바꿔보세요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
