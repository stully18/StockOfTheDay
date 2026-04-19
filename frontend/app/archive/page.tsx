"use client";
import { useState, useEffect, useCallback } from "react";
import { getArchive, formatPrice } from "@/lib/api";
import { ArchiveEntry } from "@/types/stock";
import Navbar from "@/components/Navbar";
import { Search, TrendingUp, Calendar } from "lucide-react";

export default function ArchivePage() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchive = useCallback(async (q: string) => {
    setLoading(true);
    const data = await getArchive(q);
    setEntries(data.results ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchArchive(query), 300);
    return () => clearTimeout(timeout);
  }, [query, fetchArchive]);

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12">
        <div className="mb-10 animate-fade-up max-w-2xl">
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl sm:text-4xl font-bold text-[var(--on-surface)] tracking-tight mb-2"
          >
            Archive
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)]">
            Every stock we&apos;ve ever featured, in one vault index.
          </p>
        </div>

        <div className="relative mb-8 animate-fade-up delay-100 max-w-xl">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker or company name…"
            aria-label="Search archive"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[var(--surface-container-low)] text-[var(--on-surface)] placeholder:text-[var(--fg-subtle)] outline-none transition-shadow duration-200"
            style={{
              boxShadow: "inset 0 0 0 1px var(--ghost-border)",
            }}
            onFocus={(e) => {
              e.target.style.boxShadow =
                "inset 0 0 0 2px var(--primary), 0 0 0 4px color-mix(in srgb, var(--primary) 15%, transparent)";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "inset 0 0 0 1px var(--ghost-border)";
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-[var(--on-surface-variant)] text-sm">
              {query ? `No results for "${query}"` : "No archived stocks yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
            {entries.map((entry) => (
              <ArchiveCard key={`${entry.ticker}-${entry.date}`} entry={entry} />
            ))}
          </div>
        )}
      </main>
      <footer className="mt-auto bg-[var(--surface-container-low)] py-8 text-center text-[11px] text-[var(--on-surface-variant)]">
        Market data via Yahoo Finance · For informational purposes only
      </footer>
    </>
  );
}

function ArchiveCard({ entry }: { entry: ArchiveEntry }) {
  const date = new Date(entry.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-lg bg-[var(--surface-container)] p-5 transition-colors duration-200 hover:bg-[var(--surface-container-high)] group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-xl font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors"
          >
            {entry.ticker}
          </span>
          <p className="text-xs text-[var(--on-surface-variant)] mt-1 line-clamp-2">{entry.company_name}</p>
        </div>
        <span
          className="text-lg font-bold text-[var(--on-surface)] tabular-nums shrink-0"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {formatPrice(entry.current_price)}
        </span>
      </div>

      <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed line-clamp-3 mb-6">
        {entry.why_featured}
      </p>

      <div className="flex items-center justify-between text-[10px] text-[var(--fg-subtle)] uppercase tracking-wider">
        <span className="flex items-center gap-1.5 min-w-0">
          <TrendingUp size={10} className="shrink-0 text-[var(--primary)]" />
          <span className="truncate">{entry.sector}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <Calendar size={10} />
          {date}
        </span>
      </div>
    </div>
  );
}
