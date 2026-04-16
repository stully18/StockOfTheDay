interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`rounded-xl p-3 sm:p-3.5 border ${
      accent
        ? "bg-[var(--accent-bg)] border-[var(--accent)]/20"
        : "bg-[var(--bg-card)] border-[var(--border)]"
    } shadow-[var(--shadow-sm)] min-h-[5.5rem] sm:min-h-[5.75rem] flex flex-col items-center justify-center text-center`}>
      <p className="text-[10px] sm:text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.14em] mb-1">{label}</p>
      <p className={`text-lg sm:text-xl font-600 leading-tight ${accent ? "text-[var(--accent-dark)]" : "text-[var(--fg)]"}`}
         style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
      {sub && <p className="text-[10px] sm:text-[11px] text-[var(--fg-subtle)] mt-0.5">{sub}</p>}
    </div>
  );
}
