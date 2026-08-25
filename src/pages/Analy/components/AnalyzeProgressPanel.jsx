import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { formatUserMessage } from "../../../shared/lib/userErrorMessage";

const STAGE_LABEL = {
  SNAPSHOT: "레포지토리 스냅샷 준비",
  LICENSE: "대표 라이선스 분석",
  BUILD: "빌드 환경 분석",
  EXTRACTION: "소스 코드와 바이트코드 분석",
  GRAPHSTORE: "코드 구조 그래프 저장",
  CLUSTER: "주요 모듈과 군집 분석",
  CLASSMAP: "클래스 다이어그램 생성",
  RULE: "규칙 후보 추출",
  LLM: "LLM 분석 결과 생성",
  LLM_REFINED_RULES: "LLM 정제 규칙 생성",
  LLM_SCENARIO_SPECS: "LLM 시나리오 생성",
  LLM_SUBSYSTEM_SUMMARIES: "LLM 서브시스템 요약 생성",
  LLM_API_DOCS: "LLM API 문서 생성",
  LLM_FILE_TREE_DOCS: "LLM 파일 트리 문서 생성",
};

const SUCCESS_MESSAGE = {
  SNAPSHOT: "레포지토리 스냅샷 준비가 완료됐습니다.",
  LICENSE: "대표 라이선스 분석이 완료됐습니다.",
  BUILD: "빌드 환경 분석이 완료됐습니다.",
  EXTRACTION: "소스 코드와 바이트코드 분석이 완료됐습니다.",
  GRAPHSTORE: "코드 구조 그래프 저장이 완료됐습니다.",
  CLUSTER: "주요 모듈과 군집 분석이 완료됐습니다.",
  CLASSMAP: "클래스 다이어그램 생성이 완료됐습니다.",
  RULE: "규칙 후보 추출이 완료됐습니다.",
  LLM: "LLM 분석 결과 생성이 완료됐습니다.",
  LLM_REFINED_RULES: "LLM 정제 규칙 생성이 완료됐습니다.",
  LLM_SCENARIO_SPECS: "LLM 시나리오 생성이 완료됐습니다.",
  LLM_SUBSYSTEM_SUMMARIES: "LLM 서브시스템 요약 생성이 완료됐습니다.",
  LLM_API_DOCS: "LLM API 문서 생성이 완료됐습니다.",
  LLM_FILE_TREE_DOCS: "LLM 파일 트리 문서 생성이 완료됐습니다.",
};

const RUNNING_MESSAGE = {
  SNAPSHOT: "레포지토리 스냅샷을 준비 중입니다.",
  LICENSE: "대표 라이선스 정보를 분석 중입니다.",
  BUILD: "빌드 환경을 분석 중입니다.",
  EXTRACTION: "소스 코드와 바이트코드를 분석 중입니다.",
  GRAPHSTORE: "코드 구조 그래프를 저장 중입니다.",
  CLUSTER: "주요 모듈과 군집을 분석 중입니다.",
  CLASSMAP: "클래스 다이어그램을 생성 중입니다.",
  RULE: "규칙 후보를 추출 중입니다.",
  LLM: "LLM 분석 결과를 생성 중입니다.",
  LLM_REFINED_RULES: "LLM 정제 규칙을 생성 중입니다.",
  LLM_SCENARIO_SPECS: "LLM 시나리오를 생성 중입니다.",
  LLM_SUBSYSTEM_SUMMARIES: "LLM 서브시스템 요약을 생성 중입니다.",
  LLM_API_DOCS: "LLM API 문서를 생성 중입니다.",
  LLM_FILE_TREE_DOCS: "LLM 파일 트리 문서를 생성 중입니다.",
};

function formatStageLabel(stage) {
  if (!stage) {
    return "-";
  }

  if (STAGE_LABEL[stage]) {
    return STAGE_LABEL[stage];
  }

  if (stage.startsWith("LLM_")) {
    return `LLM ${stage
      .replace("LLM_", "")
      .toLowerCase()
      .replaceAll("_", " ")}`;
  }

  return stage;
}

function getStepMessage(step) {
  if (!step) return "";

  if (step.status === "SUCCESS") {
    return SUCCESS_MESSAGE[step.stage] ?? `${formatStageLabel(step.stage)} 단계가 완료됐습니다.`;
  }

  if (step.status === "FAILED") {
    return (
      (step.errorMessage ? formatUserMessage(step.errorMessage) : null) ??
      (step.message ? formatUserMessage(step.message) : null) ??
      `${formatStageLabel(step.stage)} 단계에 실패했습니다.`
    );
  }

  if (step.status === "SKIPPED") {
    return (
      (step.message ? formatUserMessage(step.message) : null) ??
      `${formatStageLabel(step.stage)} 단계를 건너뛰었습니다.`
    );
  }

  if (step.status === "RUNNING") {
    return (
      RUNNING_MESSAGE[step.stage] ??
      (step.message ? formatUserMessage(step.message) : null) ??
      "작업을 진행 중입니다."
    );
  }

  return (
    (step.message ? formatUserMessage(step.message) : null) ??
    `${formatStageLabel(step.stage)} 대기 중입니다.`
  );
}

function StepIcon({ status }) {
  if (status === "SUCCESS") {
    return <CheckCircle2 size={18} className="text-emerald-300" />;
  }

  if (status === "FAILED") {
    return <TriangleAlert size={18} className="text-red-300" />;
  }

  if (status === "RUNNING") {
    return <Loader2 size={18} className="animate-spin text-cyan-300" />;
  }

  if (status === "SKIPPED") {
    return <Clock size={18} className="text-yellow-300" />;
  }

  return <Circle size={18} className="text-gray-600" />;
}

function stepStatusClass(status) {
  if (status === "SUCCESS") return "text-emerald-200";
  if (status === "FAILED") return "text-red-200";
  if (status === "RUNNING") return "text-cyan-200";
  if (status === "SKIPPED") return "text-yellow-200";
  return "text-gray-500";
}

function isCompleted(progress) {
  return (
    progress?.status === "SUCCESS" &&
    (progress?.stage === "DONE" || Number(progress?.progress) >= 100)
  );
}

export default function AnalyzeProgressPanel({ progress }) {
  const completed = isCompleted(progress);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(completed);
  }, [completed]);

  if (!progress) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 size={18} className="animate-spin" />
          <span>분석 상태를 불러오는 중입니다.</span>
        </div>
      </section>
    );
  }

  const steps = progress.steps ?? [];
  const progressValue = Number(progress.progress) || 0;
  const successCount = steps.filter((step) => step.status === "SUCCESS").length;
  const failedCount = steps.filter((step) => step.status === "FAILED").length;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <button
        type="button"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          {completed ? (
            <CheckCircle2 size={21} className="shrink-0 text-emerald-300" />
          ) : progress.status === "FAILED" ? (
            <TriangleAlert size={21} className="shrink-0 text-red-300" />
          ) : (
            <Loader2 size={21} className="shrink-0 animate-spin text-cyan-300" />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-100">작업 프로세스</h3>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-gray-300">
                {successCount}/{steps.length || "-"} 단계 완료
              </span>
              {failedCount > 0 && (
                <span className="rounded-full border border-red-300/20 bg-red-300/10 px-2.5 py-1 text-xs font-semibold text-red-100">
                  실패 {failedCount}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-gray-400">
              {completed
                ? "분석이 완료되었습니다. 상세 과정은 펼쳐서 확인할 수 있습니다."
                : progress.message
                  ? formatUserMessage(progress.message)
                  : progress.stageLabel ?? "분석 작업을 진행하고 있습니다."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-lg font-bold text-gray-100">{progressValue}%</span>
          <ChevronDown
            size={19}
            className={`text-gray-400 transition-transform ${collapsed ? "-rotate-90" : "rotate-0"}`}
          />
        </div>
      </button>

      <div className="h-1.5 overflow-hidden bg-[var(--surface-secondary)]">
        <div
          className="h-full bg-cyan-300 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
        />
      </div>

      {!collapsed && (
        <div className="border-t border-white/10 p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] divide-y divide-[var(--border)]">
            {steps.map((step, index) => (
              <article
                key={step.stage}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-hover)] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:items-start"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-gray-400">
                  {index + 1}
                </span>

                <div className="flex items-start gap-3 sm:contents">
                  <div className="mt-1 shrink-0">
                    <StepIcon status={step.status} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-gray-100">
                        {formatStageLabel(step.stage)}
                      </h4>

                      {!step.required && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-gray-400">
                          선택
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-5 text-gray-300">
                      {getStepMessage(step)}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${stepStatusClass(
                      step.status
                    )}`}
                  >
                    {step.status ?? "PENDING"}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {progress.failedSteps?.length > 0 && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/10 p-4">
              <p className="font-semibold text-red-200">일부 작업에 실패했습니다.</p>

              <ul className="mt-2 space-y-1 text-sm text-red-200/80">
                {progress.failedSteps.map((step) => (
                  <li key={step.stage}>
                    {formatStageLabel(step.stage)}:{" "}
                    {formatUserMessage(step.message)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
