export default function LicenseMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "text-cyan-100",
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>

      <p className={`mt-3 text-2xl font-black ${tone}`}>{value}</p>

      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
