import { getTodayStock } from "@/lib/api";
import { StockOfTheDay } from "@/types/stock";
import Navbar from "@/components/Navbar";
import StockChart from "@/components/StockChart";
import LiveBadge from "@/components/LiveBadge";
import AnalystRatings from "@/components/AnalystRatings";
import NewsHeadlines from "@/components/NewsHeadlines";
import AnimatedPrice from "@/components/AnimatedPrice";
import KeyStatistics from "@/components/KeyStatistics";
import { TrendingUp, Building2, BarChart3 } from "lucide-react";

export default async function HomePage() {
  const stock: StockOfTheDay | null = await getTodayStock();

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12">
        {stock ? (
          <StockView stock={stock} />
        ) : (
          <EmptyState />
        )}
      </main>
      <footer className="mt-auto bg-[var(--surface-container-low)] py-8 text-center text-[11px] text-[var(--on-surface-variant)]">
        Market data via Alpha Vantage & Yahoo Finance · Updated daily · For informational purposes only
      </footer>
    </>
  );
}

function StockView({ stock }: { stock: StockOfTheDay }) {
  const today = new Date(stock.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero — ticker + live price grouped (no wide empty gutter) */}
      <div className="animate-fade-up flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
        <div className="min-w-0 flex-1 space-y-3 lg:max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--surface-container)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
              Stock of the Day
            </span>
            <span className="text-xs font-medium text-[var(--fg-subtle)] tabular-nums">{today}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              style={{ fontFamily: "var(--font-display)" }}
              className="text-3xl sm:text-4xl font-bold text-[var(--primary)] tracking-tight"
            >
              {stock.ticker}
            </span>
            <LiveBadge />
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--on-surface)] tracking-tight leading-[1.2]"
          >
            {stock.company_name}
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] max-w-xl leading-relaxed">
            {stock.sector} · {stock.industry}. Featured from today&apos;s cross-market mention data.
          </p>
        </div>

        <div className="w-full shrink-0 sm:max-w-md lg:w-[min(100%,19.5rem)] lg:max-w-none">
          <div
            className="rounded-lg bg-[var(--surface-container-high)] p-4 sm:p-5 transition-colors duration-200 hover:bg-[var(--surface-container-highest)]"
            style={{ boxShadow: "inset 4px 0 0 0 var(--primary)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--on-surface-variant)] mb-2">
              Live price
            </p>
            <AnimatedPrice
              price={stock.current_price}
              priceChange={stock.price_change}
              priceChangePct={stock.price_change_pct}
              sector={stock.sector}
              industry={stock.industry}
              showMeta={false}
            />
          </div>
        </div>
      </div>

      {/* Featured narrative */}
      <div className="animate-fade-up delay-200 why-featured-card rounded-lg bg-[var(--surface-container-low)] p-5 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-[var(--primary)]" strokeWidth={2} />
          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-[0.14em]">
            Why it&apos;s featured today
          </span>
        </div>
        <p className="text-sm sm:text-base text-[var(--on-surface)] leading-relaxed max-w-4xl">
          {stock.why_featured}
        </p>
        <p className="text-xs text-[var(--on-surface-variant)] mt-4">
          Mentioned across <strong className="text-[var(--on-surface)]">{stock.mention_count}</strong> news
          items today
        </p>
      </div>

      {/* Performance + key stats — equal height on large screens */}
      <div className="animate-fade-up delay-300 grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-stretch">
        <div className="lg:col-span-8 min-w-0 flex min-h-0">
          <StockChart ticker={stock.ticker} />
        </div>
        <div className="lg:col-span-4 min-w-0 flex min-h-0">
          <KeyStatistics stock={stock} />
        </div>
      </div>

      {/* Analyst on left, company + market intelligence on right */}
      <div className="animate-fade-up delay-400 grid lg:grid-cols-12 gap-3 lg:gap-4 items-start">
        <div className="lg:col-span-5">
          <AnalystRatings stock={stock} />
        </div>
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg bg-[var(--surface-container)] p-5 sm:p-6 transition-colors duration-200 hover:bg-[var(--surface-container-high)]">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} className="text-[var(--on-surface-variant)]" />
              <span className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em]">
                About {stock.company_name}
              </span>
            </div>
            <p className="text-sm sm:text-base text-[var(--on-surface-variant)] leading-relaxed line-clamp-8">
              {stock.description || "Company description not available."}
            </p>
          </div>
          {stock.headlines && stock.headlines.length > 0 && (
            <NewsHeadlines headlines={stock.headlines.slice(0, 3)} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center mb-5">
        <BarChart3 size={24} className="text-[var(--primary)]" />
      </div>
      <h2
        style={{ fontFamily: "var(--font-display)" }}
        className="text-xl font-bold text-[var(--on-surface)] mb-2"
      >
        Vault empty
      </h2>
      <p className="text-sm text-[var(--on-surface-variant)] max-w-sm">
        The daily scraper hasn&apos;t run yet. Check back soon — a new stock will be featured shortly.
      </p>
    </div>
  );
}
