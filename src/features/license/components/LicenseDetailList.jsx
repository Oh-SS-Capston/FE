import { CheckCircle2 } from "lucide-react";

export default function LicenseDetailList({ title, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h4 className="text-sm font-bold text-slate-100">{title}</h4>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-5 text-gray-300">
              <CheckCircle2
                size={15}
                className="mt-0.5 shrink-0 text-emerald-300"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}
