"use client";
import { useEffect, useState } from "react";
import { StockOfTheDay } from "@/types/stock";

interface Props {
  stock: StockOfTheDay;
}

type Tier = { label: string; count: number; color: string; bg: string };

function getConsensus(tiers: Tier[]): { label: string; color: string; bg: string } {
  const total = tiers.reduce((s, t) => s + t.count, 0);
  if (total === 0)
    return { label: "No Data", color: "var(--on-surface-variant)", bg: "var(--surface-container-low)" };

  const bullish = tiers[0].count + tiers[1].count;
  const bearish = tiers[3].count + tiers[4].count;
  const pct = bullish / total;

  if (pct >= 0.7)
    return { label: "Strong Buy", color: "var(--on-primary)", bg: "color-mix(in srgb, var(--primary) 35%, var(--surface-container))" };
  if (pct >= 0.55)
    return { label: "Buy", color: "var(--primary)", bg: "color-mix(in srgb, var(--primary) 18%, var(--surface-container))" };
  if (bearish / total >= 0.4)
    return { label: "Sell", color: "var(--negative)", bg: "var(--negative-bg)" };
  return { label: "Hold", color: "#fbbf24", bg: "color-mix(in srgb, #fbbf24 12%, var(--surface-container))" };
}

const TIER_COLORS = {
  strongBuy: "#34d399",
  buy: "var(--primary)",
  hold: "#fbbf24",
  sell: "#fb923c",
  strongSell: "var(--negative)",
};

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
    { label: "Strong Buy", count: analyst_strong_buy ?? 0, color: TIER_COLORS.strongBuy, bg: "" },
    { label: "Buy", count: analyst_buy ?? 0, color: TIER_COLORS.buy, bg: "" },
    { label: "Hold", count: analyst_hold ?? 0, color: TIER_COLORS.hold, bg: "" },
    { label: "Sell", count: analyst_sell ?? 0, color: TIER_COLORS.sell, bg: "" },
    { label: "Strong Sell", count: analyst_strong_sell ?? 0, color: TIER_COLORS.strongSell, bg: "" },
  ];

  const total = tiers.reduce((s, t) => s + t.count, 0);
  const hasData = total > 0;
  const consensus = getConsensus(tiers);

  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const upside =
    analyst_target_price && current_price > 0
      ? ((analyst_target_price - current_price) / current_price) * 100
      : null;

  return (
    <div className="rounded-lg bg-[var(--surface-container)] p-4 sm:p-5 h-full transition-colors duration-200 hover:bg-[var(--surface-container-high)]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em]">
          Analyst consensus
        </h2>
        {hasData && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: consensus.color, background: consensus.bg }}
          >
            {consensus.label}
          </span>
        )}
      </div>

      {!hasData ? (
        <p className="text-sm text-[var(--on-surface-variant)] text-center py-8">Analyst data unavailable</p>
      ) : (
        <>
          <div className="flex rounded-full overflow-hidden h-2 mb-5 gap-px bg-[var(--surface-container-lowest)]">
            {tiers.map((tier) =>
              tier.count > 0 ? (
                <div
                  key={tier.label}
                  title={`${tier.label}: ${tier.count}`}
                  style={{
                    flex: barsReady ? tier.count : 0,
                    background: tier.color,
                    transition: "flex 0.8s cubic-bezier(0.16, 1, 0.3, 1) 100ms",
                  }}
                />
              ) : null
            )}
          </div>

          <div className="space-y-3 mb-6">
            {tiers.map((tier, i) => (
              <div key={tier.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                <span className="text-xs text-[var(--on-surface-variant)] flex-1">{tier.label}</span>
                <span className="text-xs font-semibold text-[var(--on-surface)] tabular-nums">{tier.count}</span>
                <div className="w-16 bg-[var(--surface-container-lowest)] rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: barsReady ? `${total > 0 ? (tier.count / total) * 100 : 0}%` : "0%",
                      background: tier.color,
                      transition: `width 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[var(--fg-subtle)] mb-6">
            Based on {total} analyst{total !== 1 ? "s" : ""}
          </p>

          {analyst_target_price && (
            <div className="rounded-lg bg-[var(--surface-container-lowest)] p-4 mt-2">
              <p className="text-[10px] text-[var(--on-surface-variant)] mb-2 uppercase tracking-[0.14em] font-semibold">
                Consensus target
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-xl font-bold text-[var(--on-surface)] tabular-nums"
                >
                  ${analyst_target_price.toFixed(2)}
                </span>
                {upside !== null && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: upside >= 0 ? "var(--primary)" : "var(--negative)",
                      background:
                        upside >= 0
                          ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                          : "var(--negative-bg)",
                    }}
                  >
                    {upside >= 0 ? "+" : ""}
                    {upside.toFixed(1)}%
                  </span>
                )}
              </div>
              {upside !== null && (
                <p className="text-[11px] text-[var(--fg-subtle)] mt-2">
                  {upside >= 0 ? "Implied upside" : "Implied downside"} from ${current_price.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
