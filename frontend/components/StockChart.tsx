"use client";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getChartData } from "@/lib/api";
import { PricePoint } from "@/types/stock";

const PERIODS = [
  { label: "1D",  value: "1d"  },
  { label: "5D",  value: "5d"  },
  { label: "1M",  value: "1mo" },
  { label: "3M",  value: "3mo" },
  { label: "6M",  value: "6mo" },
  { label: "1Y",  value: "1y"  },
];

interface Props { ticker: string; }

export default function StockChart({ ticker }: Props) {
  const [period, setPeriod]   = useState("1mo");
  const [data, setData]       = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getChartData(ticker, period)
      .then((res) => {
        setData(res?.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [ticker, period]);

  const prices     = data.map((d) => d.close);
  const firstPrice = prices[0] ?? 0;
  const lastPrice  = prices[prices.length - 1] ?? 0;
  const returnAmt  = lastPrice - firstPrice;
  const returnPct  = firstPrice > 0 ? (returnAmt / firstPrice) * 100 : 0;
  const isPositive = returnAmt >= 0;
  const color      = isPositive ? "var(--accent)" : "var(--negative)";
  const returnBg   = isPositive ? "var(--accent-bg)" : "var(--negative-bg)";
  const minPrice   = prices.length ? Math.min(...prices) : 0;
  const maxPrice   = prices.length ? Math.max(...prices) : 0;

  const formatLabel = (ts: string) => {
    const d = new Date(ts);
    if (period === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (period === "5d") return d.toLocaleDateString([], { month: "short", day: "numeric" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const chartData = data.map((d) => ({
    time:   formatLabel(d.timestamp),
    price:  d.close,
    open:   d.open,
    high:   d.high,
    low:    d.low,
    volume: d.volume,
  }));

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-[var(--shadow-sm)]">

      {/* Header row: label + return + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
            Price Chart
          </span>
          {!loading && prices.length > 1 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ background: returnBg, color: isPositive ? "var(--accent-dark)" : "var(--negative)" }}
            >
              {isPositive ? "▲" : "▼"}
              {Math.abs(returnPct).toFixed(2)}%
              <span className="font-normal opacity-70">
                ({isPositive ? "+" : ""}${returnAmt.toFixed(2)})
              </span>
            </span>
          )}
        </div>

        {/* Period tabs */}
        <div className="flex gap-0.5 bg-[var(--bg)] rounded-lg p-0.5 self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                period === p.value
                  ? "bg-[var(--bg-card)] text-[var(--fg)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      {loading ? (
        <div className="h-52 sm:h-64 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || prices.length === 0 ? (
        <div className="h-52 sm:h-64 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-[var(--fg-muted)]">Chart data unavailable right now.</p>
          <button
            onClick={() => { setLoading(true); getChartData(ticker, period).then((r) => { setData(r?.data ?? []); setLoading(false); }); }}
            className="text-xs text-[var(--accent)] underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--fg-subtle)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice * 0.997, maxPrice * 1.003]}
              tick={{ fontSize: 10, fill: "var(--fg-subtle)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background:   "var(--bg-card)",
                border:       "1px solid var(--border)",
                borderRadius: "10px",
                fontSize:     "12px",
                boxShadow:    "var(--shadow-md)",
              }}
              labelStyle={{ color: "var(--fg-muted)", marginBottom: 4 }}
              formatter={(v: unknown) => {
                const val = v as number;
                const diff = val - firstPrice;
                const pct  = firstPrice > 0 ? (diff / firstPrice) * 100 : 0;
                const sign = diff >= 0 ? "+" : "";
                return [
                  `$${val.toFixed(2)}   ${sign}${pct.toFixed(2)}%`,
                  "Price",
                ];
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
