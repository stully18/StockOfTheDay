"use client";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getChartData } from "@/lib/api";
import { PricePoint } from "@/types/stock";

const PERIODS = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
];

interface Props { ticker: string; }

export default function StockChart({ ticker }: Props) {
  const [period, setPeriod] = useState("1mo");
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getChartData(ticker, period).then((res) => {
      setData(res?.data ?? []);
      setLoading(false);
    });
  }, [ticker, period]);

  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const isPositive = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;
  const color = isPositive ? "var(--accent)" : "var(--negative)";

  const formatLabel = (ts: string) => {
    const d = new Date(ts);
    if (period === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const chartData = data.map((d) => ({
    time: formatLabel(d.timestamp),
    price: d.close,
    open: d.open,
    high: d.high,
    low: d.low,
    volume: d.volume,
  }));

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-[var(--shadow-sm)]">
      {/* Period selector */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Price Chart</span>
        <div className="flex gap-0.5 bg-[var(--bg)] rounded-lg p-0.5">
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

      {loading ? (
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
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
              domain={[minPrice * 0.998, maxPrice * 1.002]}
              tick={{ fontSize: 10, fill: "var(--fg-subtle)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "var(--shadow-md)",
              }}
              formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, "Price"]}
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
