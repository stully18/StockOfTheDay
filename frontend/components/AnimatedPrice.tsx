"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  price: number;
  priceChange: number | null;
  priceChangePct: number | null;
  sector: string;
  industry: string;
  /** When false, hides sector / industry line (e.g. when shown elsewhere on the page). */
  showMeta?: boolean;
}

function useCountUp(target: number, duration = 850) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function AnimatedPrice({
  price,
  priceChange,
  priceChangePct,
  sector,
  industry,
  showMeta = true,
}: Props) {
  const animated = useCountUp(price, 850);
  const [shimmer, setShimmer] = useState(false);
  const shimmerKey = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      shimmerKey.current += 1;
      setShimmer(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  const pos = (priceChangePct ?? 0) >= 0;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animated);

  return (
    <div className="text-left animate-fade-up delay-100">
      <div className="relative inline-block overflow-hidden">
        <p
          style={{ fontFamily: "var(--font-display)" }}
          className="text-3xl sm:text-4xl font-bold text-[var(--on-surface)] tabular-nums tracking-tight"
        >
          {formatted}
        </p>
        {shimmer && (
          <span key={shimmerKey.current} className="price-shimmer-overlay" aria-hidden />
        )}
      </div>

      {priceChangePct !== null && (
        <p
          className="text-sm font-semibold mt-1"
          style={{ color: pos ? "var(--primary)" : "var(--negative)" }}
        >
          {pos ? "\u25B2" : "\u25BC"} {Math.abs(priceChangePct ?? 0).toFixed(2)}%
          {priceChange !== null && (
            <span className="text-xs font-normal text-[var(--on-surface-variant)] ml-1">
              ({pos ? "+" : ""}${(priceChange ?? 0).toFixed(2)})
            </span>
          )}
        </p>
      )}
      {showMeta && (
        <p className="text-xs text-[var(--on-surface-variant)] mt-2">
          {sector} · {industry}
        </p>
      )}
    </div>
  );
}
