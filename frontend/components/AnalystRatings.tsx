"use client";
import { StockOfTheDay } from "@/types/stock";

interface Props {
  stock: StockOfTheDay;
}

type Tier = { label: string; count: number; color: string; bg: string };

function getConsensus(tiers: Tier[]): { label: string; color: string; bg: string } {
  const total   = tiers.reduce((s, t) => s + t.count, 0);
  if (total === 0) return { label: "No Data", color: "var(--fg-muted)", bg: "var(--bg)" };

  const bullish = tiers[0].count + tiers[1].count;
  const bearish = tiers[3].count + tiers[4].count;
  const pct     = bullish / total;

  if (pct >= 0.70) return { label: "Strong Buy",  color: "#00a87e", bg: "#e6faf5" };
  if (pct >= 0.55) return { label: "Buy",          color: "#00c896", bg: "#f0fdf9" };
  if (bearish / total >= 0.40) return { label: "Sell", color: "#ff4d4d", bg: "#fff0f0" };
  return                        { label: "Hold",        color: "#f59e0b", bg: "#fffbeb" };
}

export default function AnalystRatings({ stock }: Props) {
  const {
    analyst_strong_buy,
    analyst_buy,
    analyst_hold,
    analyst_sell,
    analyst_strong_sell,
    analyst_target_price,
    current_price,
  } = stock;

  const tiers: Tier[] = [
    { label: "Strong Buy", count: analyst_strong_buy  ?? 0, color: "#00a87e", bg: "#e6faf5" },
    { label: "Buy",        count: analyst_buy         ?? 0, color: "#00c896", bg: "#f0fdf9" },
    { label: "Hold",       count: analyst_hold        ?? 0, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Sell",       count: analyst_sell        ?? 0, color: "#f97316", bg: "#fff7ed" },
    { label: "Strong Sell",count: analyst_strong_sell ?? 0, color: "#ff4d4d", bg: "#fff0f0" },
  ];

  const total       = tiers.reduce((s, t) => s + t.count, 0);
  const hasData     = total > 0;
  const consensus   = getConsensus(tiers);

  const upside =
    analyst_target_price && current_price > 0
      ? ((analyst_target_price - current_price) / current_price) * 100
      : null;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-3.5 sm:p-4 shadow-[var(--shadow-sm)] h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
          Analyst Ratings
        </span>
        {hasData && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: consensus.color, background: consensus.bg }}
          >
            {consensus.label}
          </span>
        )}
      </div>

      {!hasData ? (
        <p className="text-sm text-[var(--fg-muted)] text-center py-6">
          Analyst data unavailable
        </p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-2 mb-3 gap-px">
            {tiers.map((tier) =>
              tier.count > 0 ? (
                <div
                  key={tier.label}
                  title={`${tier.label}: ${tier.count}`}
                  style={{
                    flex:       tier.count,
                    background: tier.color,
                  }}
                />
              ) : null
            )}
          </div>

          {/* Breakdown rows */}
          <div className="space-y-1.5 mb-3">
            {tiers.map((tier) => (
              <div key={tier.label} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: tier.color }}
                />
                <span className="text-xs text-[var(--fg-muted)] flex-1">{tier.label}</span>
                <span className="text-xs font-medium text-[var(--fg)] tabular-nums">
                  {tier.count}
                </span>
                <div className="w-16 bg-[var(--bg)] rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:      `${total > 0 ? (tier.count / total) * 100 : 0}%`,
                      background: tier.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-[var(--fg-subtle)] mb-3">
            Based on {total} analyst{total !== 1 ? "s" : ""}
          </div>

          {/* Price target */}
          {analyst_target_price && (
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-xs text-[var(--fg-muted)] mb-1 uppercase tracking-wider font-medium">
                Consensus Target
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-xl font-700 text-[var(--fg)]"
                >
                  ${analyst_target_price.toFixed(2)}
                </span>
                {upside !== null && (
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color:      upside >= 0 ? "var(--accent-dark)" : "var(--negative)",
                      background: upside >= 0 ? "var(--accent-bg)"   : "var(--negative-bg)",
                    }}
                  >
                    {upside >= 0 ? "+" : ""}{upside.toFixed(1)}%
                  </span>
                )}
              </div>
              {upside !== null && (
                <p className="text-xs text-[var(--fg-subtle)] mt-0.5">
                  {upside >= 0 ? "implied upside" : "implied downside"} from ${current_price.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
