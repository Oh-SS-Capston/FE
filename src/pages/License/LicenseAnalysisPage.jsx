import { ArrowLeft, BadgeCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import LicenseActionGuide from "../../features/license/components/LicenseActionGuide";
import LicenseAnalysisSection from "../../features/license/components/LicenseAnalysisSection";
import LicenseEvidenceExplorer from "../../features/license/components/LicenseEvidenceExplorer";
import { useLicenseAnalysisArtifact } from "../../features/license/hooks/useLicenseAnalysisArtifact";
import { buildAnalyzePath } from "../../features/license/lib/licenseNavigation";
import { useRunProgressPolling } from "../../features/run/hooks/useRunProgressPolling";

function StatusPill({ progress, loading }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
        <RefreshCw size={13} className="animate-spin" />
        진행 상태 확인 중
      </span>
    );
  }

  if (!progress) {
    return (
      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
        진행 정보 없음
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
      <BadgeCheck size={13} />
      {progress.status ?? "UNKNOWN"}
    </span>
  );
}

export default function LicenseAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const runId = location.state?.runId ?? searchParams.get("runId");
  const repo = location.state?.repo ?? searchParams.get("repo");

  const {
    progress,
    loading: progressLoading,
    error: progressError,
  } = useRunProgressPolling(runId);

  const {
    artifactId,
    analysis,
    loading: licenseLoading,
    error: licenseError,
  } = useLicenseAnalysisArtifact(progress, runId);

  const goBackToAnalyze = () => {
    navigate(buildAnalyzePath({ runId, repo }), {
      state: {
        runId,
        repo,
      },
    });
  };

  if (!runId) {
    return (
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
        <section className="max-w-lg rounded-[1.75rem] border border-white/10 bg-[#080817]/80 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-100">
            <ShieldCheck size={22} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-white">
            라이선스 분석 실행 ID가 없습니다.
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            분석 결과에서 라이선스 상세 페이지로 다시 이동해주세요.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/20"
          >
            홈으로 돌아가기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative z-10">
      <div className="mx-auto w-[90vw] max-w-[1500px] px-6 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={goBackToAnalyze}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={18} />
              분석 결과로 돌아가기
            </button>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
                <ShieldCheck size={14} />
                License Center
              </span>
              <StatusPill progress={progress} loading={progressLoading} />
            </div>

            <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">
              대표 라이선스 상세 분석
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 md:text-base">
              자동 분석 결과를 한 화면에서 검토할 수 있도록 대표 라이선스, 검토
              필요 항목, 파일 근거를 분리해 보여줍니다.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-gray-400">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Repository
            </p>
            <p className="mt-1 break-all font-semibold text-slate-100">
              {repo ?? "unknown repository"}
            </p>
          </div>
        </div>

        {progressError && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-950/10 p-4 text-sm text-red-100">
            {progressError}
          </div>
        )}

        <div className="mt-8">
          <LicenseAnalysisSection
            artifactId={artifactId}
            analysis={analysis}
            loading={licenseLoading || progressLoading}
            error={licenseError}
          />
        </div>

        {analysis && !licenseLoading && !licenseError && (
          <>
            <div className="mt-8">
              <LicenseActionGuide analysis={analysis} />
            </div>

            <div className="mt-8">
              <LicenseEvidenceExplorer analysis={analysis} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
