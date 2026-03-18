import { Search } from "lucide-react";

export default function SearchBar({ repoUrl, onChange, onAnalyze }) {
  return (
    <div className="w-full flex gap-3">
      <input
        value={repoUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://github.com/org/repo 또는 org/repo"
        className="w-full rounded-2xl border border-white/10 bg-[#0a0a1a]/60 p-4 text-white outline-none backdrop-blur focus:border-purple-400"
      />
      <button
        onClick={onAnalyze}
        className="rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-400 px-5 py-4 font-semibold text-white shadow-[0_0_25px_rgba(124,58,237,0.4)] hover:shadow-[0_0_35px_rgba(124,58,237,0.6)] active:scale-95 transition-all flex items-center gap-2"
      >
        <Search size={20} className="stroke-[3px]" />
        Analyze
      </button>
    </div>
  );
}