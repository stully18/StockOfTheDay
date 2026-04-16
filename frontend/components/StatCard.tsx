interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`rounded-xl p-3 sm:p-4 border ${
      accent
        ? "bg-[var(--accent-bg)] border-[var(--accent)]/20"
        : "bg-[var(--bg-card)] border-[var(--border)]"
    } shadow-[var(--shadow-sm)]`}>
      <p className="text-[10px] sm:text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base sm:text-lg font-600 leading-tight ${accent ? "text-[var(--accent-dark)]" : "text-[var(--fg)]"}`}
         style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </p>
      {sub && <p className="text-[10px] sm:text-xs text-[var(--fg-subtle)] mt-0.5">{sub}</p>}
    </div>
  );
}
