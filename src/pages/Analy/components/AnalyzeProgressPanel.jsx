import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  TriangleAlert,
} from "lucide-react";

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
      step.errorMessage ??
      step.message ??
      `${formatStageLabel(step.stage)} 단계에 실패했습니다.`
    );
  }

  if (step.status === "SKIPPED") {
    return (
      step.message ?? `${formatStageLabel(step.stage)} 단계를 건너뛰었습니다.`
    );
  }

  if (step.status === "RUNNING") {
    return RUNNING_MESSAGE[step.stage] ?? step.message ?? "작업을 진행 중입니다.";
  }

  return step.message ?? `${formatStageLabel(step.stage)} 대기 중입니다.`;
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

function stepBorderClass(status) {
  if (status === "SUCCESS") return "border-emerald-400/20 bg-emerald-400/[0.04]";
  if (status === "FAILED") return "border-red-400/20 bg-red-400/[0.04]";
  if (status === "RUNNING") return "border-cyan-400/20 bg-cyan-400/[0.04]";
  if (status === "SKIPPED") return "border-yellow-400/20 bg-yellow-400/[0.04]";
  return "border-white/10 bg-white/[0.025]";
}

export default function AnalyzeProgressPanel({ progress }) {
  if (!progress) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span>분석 상태를 불러오는 중입니다.</span>
        </div>
      </section>
    );
  }

  const steps = progress.steps ?? [];
  const progressValue = progress.progress ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl">
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
        }}
      />

      <div className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-100">작업 프로세스</h3>
            <p className="mt-2 text-sm text-gray-500">
              {progress.message ?? progress.stageLabel ?? "분석 작업을 진행하고 있습니다."}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Progress
            </p>
            <p className="mt-1 text-xl font-bold text-gray-100">
              {progressValue}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-purple-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.stage}
              className={`rounded-xl border p-4 transition ${stepBorderClass(
                step.status
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <StepIcon status={step.status} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-gray-100">
                      {formatStageLabel(step.stage)}
                    </h4>

                    {!step.required && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-400">
                        선택
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-5 text-gray-400">
                    {getStepMessage(step)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {progress.failedSteps?.length > 0 && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/10 p-4">
            <p className="font-semibold text-red-200">
              일부 작업에 실패했습니다.
            </p>

            <ul className="mt-2 space-y-1 text-sm text-red-200/80">
              {progress.failedSteps.map((step) => (
                <li key={step.stage}>
                  {formatStageLabel(step.stage)}: {step.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
