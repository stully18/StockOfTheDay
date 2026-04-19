interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div
      className={`rounded-lg p-3 sm:p-3.5 min-h-[5.5rem] sm:min-h-[5.75rem] flex flex-col items-center justify-center text-center ${
        accent ? "stat-card-accent" : "stat-card"
      }`}
    >
      <p className="text-[10px] sm:text-[11px] font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em] mb-1">
        {label}
      </p>
      <p
        className={`text-lg sm:text-xl font-semibold leading-tight ${
          accent ? "text-[var(--primary)]" : "text-[var(--on-surface)]"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] sm:text-[11px] text-[var(--fg-subtle)] mt-0.5">{sub}</p>}
    </div>
  );
}
