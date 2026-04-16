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
    <header className="sticky top-0 z-50 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <TrendingUp size={14} strokeWidth={2.5} className="text-white" />
          </span>
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-sm font-700 tracking-tight text-[var(--fg)] hidden sm:block"
          >
            Stock of the Day
          </span>
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-sm font-700 tracking-tight text-[var(--fg)] sm:hidden"
          >
            SOTD
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                path === href
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--border)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
