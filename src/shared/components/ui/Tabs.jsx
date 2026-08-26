export function TabsList({ children, className = "", ...props }) {
  return (
    <div
      className={`grid gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabButton({ active, className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
        active
          ? "border-cyan-300/45 bg-[var(--surface-hover)] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
