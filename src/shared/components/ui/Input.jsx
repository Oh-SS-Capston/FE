export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`rounded-[10px] border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
