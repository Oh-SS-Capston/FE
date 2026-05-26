import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

export default function AuthRequiredPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);

    return () => window.clearTimeout(timerId);
  }, [navigate]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/20">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
          <LockKeyhole size={28} />
        </div>

        <h1 className="text-2xl font-bold text-white">
          로그인 후 접근 가능합니다.
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          해당 페이지는 로그인한 사용자만 접근할 수 있습니다.
          <br />
          3초 후 랜딩 페이지로 이동합니다.
        </p>
      </section>
    </main>
  );
}