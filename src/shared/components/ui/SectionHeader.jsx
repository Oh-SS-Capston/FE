export default function SectionHeader({
  title,
  description,
  right = null,
  className = "",
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
