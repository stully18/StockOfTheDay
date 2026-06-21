"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

const AMOUNTS = [5, 10, 25, 50, 100];

const BROKERS = [
  {
    name: "Robinhood",
    url: (ticker: string) => `https://robinhood.com/stocks/${ticker}`,
  },
  {
    name: "Fidelity",
    url: (ticker: string) =>
      `https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=${ticker}`,
  },
  {
    name: "Schwab",
    url: (ticker: string) =>
      `https://www.schwab.com/research/stocks/quotes/summary/${ticker}`,
  },
  {
    name: "Webull",
    url: (ticker: string) => `https://www.webull.com/quote/${ticker}`,
  },
  {
    name: "Public",
    url: (ticker: string) => `https://public.com/stocks/${ticker.toLowerCase()}`,
  },
];

interface BrokerLinksProps {
  ticker: string;
  price: number;
}

export default function BrokerLinks({ ticker, price }: BrokerLinksProps) {
  const [selected, setSelected] = useState(25);

  const shares = price > 0 ? (selected / price).toFixed(4) : "—";

  return (
    <div className="rounded-lg bg-[var(--surface-container-low)] p-5 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-5">
        <ArrowUpRight size={15} className="text-[var(--on-surface-variant)]" strokeWidth={2} />
        <span className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em]">
          Where to Trade
        </span>
      </div>

      {/* Amount selector + shares estimate */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[var(--on-surface-variant)] mr-1 shrink-0">
            Amount
          </span>
          {AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelected(amount)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors duration-150 ${
                selected === amount
                  ? "bg-[var(--surface-container-highest)] text-[var(--primary)]"
                  : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>
        <div className="text-xs text-[var(--on-surface-variant)] sm:border-l sm:border-[var(--ghost-border)] sm:pl-4">
          <span className="tabular-nums text-[var(--on-surface)] font-semibold">{shares}</span>{" "}
          shares of {ticker} at current price
        </div>
      </div>

      {/* Broker links */}
      <div className="flex flex-wrap gap-x-1 gap-y-2 mb-5">
        {BROKERS.map((broker, i) => (
          <span key={broker.name} className="flex items-center">
            <a
              href={broker.url(ticker)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors duration-150 underline underline-offset-2 decoration-[var(--ghost-border)] hover:decoration-[var(--on-surface-variant)]"
            >
              {broker.name}
            </a>
            {i < BROKERS.length - 1 && (
              <span className="ml-1 text-[var(--ghost-border)] select-none">·</span>
            )}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-[var(--on-surface-variant)] opacity-60 leading-relaxed">
        Links open your brokerage in a new tab. Not affiliated with any brokerage listed. Prices at time of purchase may differ.
      </p>
    </div>
  );
}
