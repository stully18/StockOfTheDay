"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp } from "lucide-react";

export default function Navbar() {
  const path = usePathname();

  const links = [
    { href: "/", label: "Today" },
    { href: "/archive", label: "Archive" },
  ];

  return (
    <header className="sticky top-0 z-50 glass-header">
      <nav className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-10 py-2 flex items-center justify-between min-h-[4.25rem]">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="w-[50px] h-[50px] shrink-0 rounded-xl bg-[var(--surface-container-high)] flex items-center justify-center transition-colors group-hover:bg-[var(--surface-container-highest)]">
            <TrendingUp size={26} strokeWidth={2} className="text-[var(--primary)]" />
          </span>
          <span style={{ fontFamily: "var(--font-display)" }} className="text-sm font-semibold tracking-tight">
            <span className="sm:hidden text-[var(--on-surface)]">SOTD</span>
            <span className="hidden sm:inline">
              <span className="text-[var(--on-surface)]">Stock of the </span>
              <span className="text-[var(--primary)]">Day</span>
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const match = href === "/" ? path === "/" : path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  match
                    ? "bg-[var(--primary)] text-[var(--on-primary)]"
                    : "text-[var(--on-secondary-container)] hover:text-[var(--on-surface)] bg-[var(--secondary-container)]/60 hover:bg-[var(--secondary-container)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
