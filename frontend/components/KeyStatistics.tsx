import { StockOfTheDay } from "@/types/stock";
import { formatMarketCap, formatPrice } from "@/lib/api";

interface Props {
  stock: StockOfTheDay;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <span className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-[0.12em] shrink-0">
        {label}
      </span>
      <span
        className="text-sm sm:text-base font-semibold text-[var(--on-surface)] tabular-nums text-right tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function KeyStatistics({ stock }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "Day High", value: formatPrice(stock.day_high) },
    { label: "Day Low", value: formatPrice(stock.day_low) },
    { label: "52W High", value: formatPrice(stock.week_52_high) },
    { label: "52W Low", value: formatPrice(stock.week_52_low) },
    { label: "Market Cap", value: formatMarketCap(stock.market_cap) },
    {
      label: "P/E Ratio",
      value: stock.pe_ratio ? stock.pe_ratio.toFixed(2) : "N/A",
    },
    {
      label: "50D Avg",
      value: stock.moving_avg_50 !== null ? formatPrice(stock.moving_avg_50) : "N/A",
    },
    {
      label: "200D Avg",
      value: stock.moving_avg_200 !== null ? formatPrice(stock.moving_avg_200) : "N/A",
    },
    { label: "Mentions Today", value: `${stock.mention_count}` },
  ];

  return (
    <div className="rounded-lg bg-[var(--surface-container)] p-4 sm:p-5 flex flex-col flex-1 w-full h-full min-h-[280px] transition-colors duration-200 hover:bg-[var(--surface-container-high)]">
      <h2 className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em] mb-1">
        Key statistics
      </h2>
      <p className="text-[11px] text-[var(--fg-subtle)] mb-4">Session &amp; fundamentals</p>
      <div className="flex flex-col flex-1">
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}
