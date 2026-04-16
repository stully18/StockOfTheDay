import { getTodayStock, formatMarketCap, formatPrice } from "@/lib/api";
import { StockOfTheDay } from "@/types/stock";
import Navbar from "@/components/Navbar";
import StockChart from "@/components/StockChart";
import StatCard from "@/components/StatCard";
import LiveBadge from "@/components/LiveBadge";
import { TrendingUp, Building2, BarChart3, Newspaper } from "lucide-react";

export default async function HomePage() {
  const stock: StockOfTheDay | null = await getTodayStock();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {stock ? (
          <StockView stock={stock} />
        ) : (
          <EmptyState />
        )}
      </main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--fg-subtle)]">
        Market data via Yahoo Finance · Updated daily · For informational purposes only
      </footer>
    </>
  );
}

function StockView({ stock }: { stock: StockOfTheDay }) {
  const today = new Date(stock.date).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-widest mb-1">{today}</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1
              style={{ fontFamily: "var(--font-display)" }}
              className="text-4xl sm:text-5xl font-800 text-[var(--fg)] tracking-tight"
            >
              {stock.ticker}
            </h1>
            <LiveBadge />
          </div>
          <p className="text-sm sm:text-base text-[var(--fg-muted)] mt-1">{stock.company_name}</p>
        </div>

        <div className="text-left sm:text-right animate-fade-up delay-100">
          <p
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl sm:text-4xl font-700 text-[var(--fg)]"
          >
            {formatPrice(stock.current_price)}
          </p>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {stock.sector} · {stock.industry}
          </p>
        </div>
      </div>

      {/* Why Featured */}
      <div className="animate-fade-up delay-200 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent)]/20 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-[var(--accent)]" />
          <span className="text-xs font-600 text-[var(--accent-dark)] uppercase tracking-wider">Why it&apos;s featured today</span>
        </div>
        <p className="text-sm sm:text-base text-[var(--fg)] leading-relaxed">{stock.why_featured}</p>
        <p className="text-xs text-[var(--fg-muted)] mt-2">
          Mentioned across <strong>{stock.mention_count}</strong> news items today
        </p>
      </div>

      {/* Chart */}
      <div className="animate-fade-up delay-300">
        <StockChart ticker={stock.ticker} />
      </div>

      {/* Stats Grid */}
      <div className="animate-fade-up delay-400 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Day High" value={formatPrice(stock.day_high)} />
        <StatCard label="Day Low" value={formatPrice(stock.day_low)} />
        <StatCard label="52W High" value={formatPrice(stock.week_52_high)} />
        <StatCard label="52W Low" value={formatPrice(stock.week_52_low)} />
        <StatCard label="Market Cap" value={formatMarketCap(stock.market_cap)} />
        <StatCard label="P/E Ratio" value={stock.pe_ratio ? stock.pe_ratio.toFixed(2) : "N/A"} />
        <StatCard label="Mentions Today" value={`${stock.mention_count}×`} accent />
        <StatCard label="Sector" value={stock.sector} sub={stock.industry} />
      </div>

      {/* Company Overview */}
      <div className="animate-fade-up delay-500 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-[var(--fg-muted)]" />
          <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">About {stock.company_name}</span>
        </div>
        <p className="text-sm sm:text-base text-[var(--fg-muted)] leading-relaxed line-clamp-6">
          {stock.description || "Company description not available."}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center mb-4">
        <BarChart3 size={24} className="text-[var(--accent)]" />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-700 text-[var(--fg)] mb-2">
        No stock selected yet
      </h2>
      <p className="text-sm text-[var(--fg-muted)] max-w-xs">
        The daily scraper hasn&apos;t run yet. Check back soon — a new stock will be featured shortly.
      </p>
    </div>
  );
}
