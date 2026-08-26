import { useNavigate } from "react-router-dom";

export default function LoginFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-2xl font-bold text-red-300">
        로그인에 실패했습니다.
      </h1>

      <p className="mt-3 text-gray-400">
        Google 로그인 처리 중 문제가 발생했습니다.
      </p>

      <button
        onClick={() => navigate("/", { replace: true })}
        className="mt-8 rounded-lg bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}
