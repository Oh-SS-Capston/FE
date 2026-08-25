import { Github, Loader2, Search } from "lucide-react";
import Button from "../../../shared/components/ui/Button";

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
    <div className="relative flex w-full min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 transition-colors focus-within:border-cyan-300/60">
      <div className="pl-3 text-[var(--text-muted)] shrink-0">
        <Github size={20} />
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
        className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
      />

      <Button
        onClick={onAnalyze}
        disabled={isDisabled}
        variant="primary"
        size="lg"
        className="shrink-0"
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
      </Button>
    </div>
  );
}
