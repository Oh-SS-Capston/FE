const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45 disabled:cursor-not-allowed disabled:opacity-55";

const variantClass = {
  primary:
    "border border-cyan-300/40 bg-cyan-300 text-slate-950 hover:bg-cyan-200",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
  ghost:
    "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
  danger:
    "border border-red-400/35 bg-red-500 text-white hover:bg-red-400",
};

const sizeClass = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  as: Component = "button",
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={`${baseClass} ${variantClass[variant] ?? variantClass.secondary} ${
        sizeClass[size] ?? sizeClass.md
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
