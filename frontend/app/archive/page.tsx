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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fade-up">
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl sm:text-4xl font-800 text-[var(--fg)] tracking-tight mb-1"
          >
            Archive
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">Every stock we&apos;ve ever featured, in one place.</p>
        </div>

        {/* Search */}
        <div className="relative mb-5 animate-fade-up delay-100">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker or company name…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all placeholder:text-[var(--fg-subtle)]"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-[var(--fg-muted)] text-sm">
              {query ? `No results for "${query}"` : "No archived stocks yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {entries.map((entry) => (
              <ArchiveCard key={`${entry.ticker}-${entry.date}`} entry={entry} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--fg-subtle)]">
        Market data via Yahoo Finance · For informational purposes only
      </footer>
    </>
  );
}

function ArchiveCard({ entry }: { entry: ArchiveEntry }) {
  const date = new Date(entry.date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-xl font-700 text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors"
          >
            {entry.ticker}
          </span>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">{entry.company_name}</p>
        </div>
        <span className="text-lg font-600 text-[var(--fg)]" style={{ fontFamily: "var(--font-display)" }}>
          {formatPrice(entry.current_price)}
        </span>
      </div>

      <p className="text-xs text-[var(--fg-muted)] leading-relaxed line-clamp-2 mb-3">
        {entry.why_featured}
      </p>

      <div className="flex items-center justify-between text-[10px] text-[var(--fg-subtle)]">
        <span className="flex items-center gap-1">
          <TrendingUp size={10} />
          {entry.sector}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          {date}
        </span>
      </div>
    </div>
  );
}
