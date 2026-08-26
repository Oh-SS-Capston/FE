const toneClass = {
  neutral:
    "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
  info: "border-cyan-300/35 bg-cyan-300/10 text-cyan-100",
  success: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  warning: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  error: "border-red-300/35 bg-red-300/10 text-red-100",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        toneClass[tone] ?? toneClass.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
