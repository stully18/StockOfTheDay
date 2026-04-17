export default function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--secondary-container)] text-[var(--primary)] text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse-dot" />
      Live
    </span>
  );
}
