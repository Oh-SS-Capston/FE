import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../features/auth/model/AuthContext";

export default function LoginSuccessPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();

  useEffect(() => {
    const checkLogin = async () => {
      const user = await refreshMe();

      if (user) {
        navigate("/", { replace: true });
      } else {
        navigate("/login/failure", { replace: true });
      }
    };

    checkLogin();
  }, [navigate, refreshMe]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      <Loader2 className="animate-spin text-cyan-300 mb-4" size={36} />
      <h1 className="text-2xl font-bold text-white">
        로그인 처리 중입니다.
      </h1>
      <p className="mt-3 text-gray-400">
        사용자 정보를 확인하고 있습니다.
      </p>
    </div>
  );
}