export default function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-bg)] border border-[var(--accent)]/25 text-[var(--accent-dark)] text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
      Live
    </span>
  );
}
