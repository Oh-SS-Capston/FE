import { Github, Loader2, Search } from "lucide-react";

export default function SearchBar({
  repoUrl,
  onChange,
  onAnalyze,
  loading = false,
  disabled = false,
  loginRequired = false,
}) {
  const isDisabled = loading || disabled;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isDisabled) {
      onAnalyze();
    }
  };

  return (
    <div className="relative flex w-full min-w-0 items-center bg-[#000000]/60 backdrop-blur-xl rounded-full border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)] focus-within:border-purple-500/50 focus-within:shadow-[0_0_50px_rgba(168,85,247,0.3)] transition-all duration-300">
      <div className="pl-8 text-gray-500 shrink-0">
        <Github size={28} />
      </div>

      <input
        value={repoUrl}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={
          loginRequired
            ? "로그인을 하면 분석을 진행할 수 있습니다"
            : "분석 url 형식: https://github.com/facebook/react.git"
        }
        className="min-w-0 flex-1 bg-transparent py-6 px-6 text-xl text-white outline-none placeholder:text-gray-600 font-medium disabled:opacity-60"
      />

      <button
        onClick={onAnalyze}
        disabled={isDisabled}
        className="mr-3 px-10 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_35px_rgba(124,58,237,0.6)] transition-all active:scale-95 flex shrink-0 items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Analyzing
          </>
        ) : (
          <>
            <Search size={20} className="stroke-[3px]" />
            Analyze
          </>
        )}
      </button>
    </div>
  );
}
