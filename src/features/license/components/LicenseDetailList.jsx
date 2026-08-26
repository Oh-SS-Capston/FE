export default function LicenseDetailList({ title, items, emptyText }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-100">{title}</h4>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-5 text-gray-300">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
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
