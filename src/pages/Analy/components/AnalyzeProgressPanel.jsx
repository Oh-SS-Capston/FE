import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

function statusText(status) {
  switch (status) {
    case "QUEUED":
      return "대기 중";
    case "RUNNING":
      return "진행 중";
    case "SUCCESS":
      return "완료";
    case "PARTIAL_SUCCESS":
      return "일부 완료";
    case "FAILED":
      return "실패";
    default:
      return "-";
  }
}

export default function AnalyzeProgressPanel({ progress }) {
  const value = progress?.progress ?? 0;
  const status = progress?.status;
  const stage = progress?.stage;
  const steps = progress?.steps ?? [];
  const failedSteps = progress?.failedSteps ?? [];

  const isRunning = status === "QUEUED" || status === "RUNNING";
  const isSuccess = status === "SUCCESS";
  const isPartial = status === "PARTIAL_SUCCESS";
  const isFailed = status === "FAILED";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a1a]/60 backdrop-blur-xl overflow-hidden">
      <div
        className="h-1 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)",
        }}
      />

      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          {isRunning && (
            <Loader2 size={22} className="animate-spin text-cyan-300" />
          )}

          {isSuccess && (
            <CheckCircle2 size={22} className="text-emerald-300" />
          )}

          {isPartial && (
            <AlertTriangle size={22} className="text-yellow-300" />
          )}

          {isFailed && (
            <XCircle size={22} className="text-red-300" />
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-100">
              {progress?.message ?? "분석 진행 상태를 확인 중입니다."}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              현재 단계: {stage ?? "-"} / 상태: {statusText(status)}
            </p>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
            style={{
              width: `${Math.max(0, Math.min(100, value))}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>{value}%</span>
          <span>100%</span>
        </div>

        {steps.length > 0 && (
          <div className="mt-6 grid md:grid-cols-2 gap-3">
            {steps.map((step) => (
              <div
                key={step.stage}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-200">
                    {step.stage}
                  </span>

                  <span className="text-xs text-gray-500">
                    {step.status}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {step.errorMessage || step.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {isPartial && failedSteps.length > 0 && (
          <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-950/10 p-4">
            <p className="text-sm font-semibold text-yellow-200 mb-2">
              일부 분석 결과 생성에 실패했습니다.
            </p>

            <ul className="space-y-1">
              {failedSteps.map((step) => (
                <li key={step.stage} className="text-sm text-yellow-100/80">
                  - {step.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isFailed && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/10 p-4">
            <p className="text-sm text-red-200">
              {progress?.failureMessage || "분석 중 오류가 발생했습니다."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}