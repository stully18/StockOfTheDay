"use client";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
  { label: "5Y", value: "5y" },
];

interface Props {
  ticker: string;
}

export default function StockChart({ ticker }: Props) {
  const [period, setPeriod] = useState("1mo");
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const plotSlotRef = useRef<HTMLDivElement>(null);
  const [plotHeight, setPlotHeight] = useState(340);

  useLayoutEffect(() => {
    const el = plotSlotRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const apply = () => {
      const h = Math.floor(el.getBoundingClientRect().height);
      if (h > 48) setPlotHeight(h);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [ticker, period, loading, error, data.length]);

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

  const prices = data.map((d) => d.close);
  const firstPrice = prices[0] ?? 0;
  const lastPrice = prices[prices.length - 1] ?? 0;
  const returnAmt = lastPrice - firstPrice;
  const returnPct = firstPrice > 0 ? (returnAmt / firstPrice) * 100 : 0;
  const isPositive = returnAmt >= 0;
  const color = isPositive ? "var(--primary)" : "var(--negative)";
  const returnBg = isPositive
    ? "color-mix(in srgb, var(--primary) 14%, var(--surface-container-low))"
    : "var(--negative-bg)";
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const formatLabel = (ts: string) => {
    const d = new Date(ts);
    if (period === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (period === "5d") return d.toLocaleDateString([], { month: "short", day: "numeric" });
    if (period === "5y") return d.toLocaleDateString([], { month: "short", year: "2-digit" });
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
    <div className="rounded-lg bg-[var(--surface-container)] flex flex-col w-full flex-1 min-h-[380px] lg:min-h-[28rem] p-3 sm:p-4 transition-colors duration-200 hover:bg-[var(--surface-container-high)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 shrink-0 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em]">
            Performance
          </h2>
          {!loading && prices.length > 1 && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: returnBg,
                color: isPositive ? "var(--primary)" : "var(--negative)",
              }}
            >
              {isPositive ? "\u25B2" : "\u25BC"}
              {Math.abs(returnPct).toFixed(2)}%
              <span className="font-normal opacity-80">
                ({isPositive ? "+" : ""}${returnAmt.toFixed(2)})
              </span>
            </span>
          )}
        </div>

        <div className="flex gap-0.5 bg-[var(--surface-container-lowest)] rounded-full p-0.5 self-start sm:self-auto shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                period === p.value
                  ? "bg-[var(--primary)] text-[var(--on-primary)]"
                  : "text-[var(--on-secondary-container)] hover:text-[var(--on-surface)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 min-h-[280px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || prices.length === 0 ? (
        <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-[var(--on-surface-variant)]">Chart data unavailable right now.</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              getChartData(ticker, period).then((r) => {
                setData(r?.data ?? []);
                setLoading(false);
              });
            }}
            className="text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          ref={plotSlotRef}
          className="flex-1 w-full min-h-[280px] min-w-0"
          style={{ flexBasis: 0 }}
        >
          <ResponsiveContainer width="100%" height={plotHeight}>
            <AreaChart
              data={chartData}
              margin={{ top: 6, right: 6, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="color-mix(in srgb, var(--outline-variant) 15%, transparent)"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "var(--fg-subtle)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis
                domain={[minPrice * 0.997, maxPrice * 1.003]}
                tick={{ fontSize: 10, fill: "var(--fg-subtle)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                width={48}
                tickMargin={6}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-container-highest)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "var(--shadow-ambient)",
                }}
                labelStyle={{ color: "var(--on-surface-variant)", marginBottom: 4 }}
                formatter={(v: unknown) => {
                  const val = v as number;
                  const diff = val - firstPrice;
                  const pct = firstPrice > 0 ? (diff / firstPrice) * 100 : 0;
                  const sign = diff >= 0 ? "+" : "";
                  return [`$${val.toFixed(2)}   ${sign}${pct.toFixed(2)}%`, "Price"];
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
        </div>
      )}
    </div>
  );
}
