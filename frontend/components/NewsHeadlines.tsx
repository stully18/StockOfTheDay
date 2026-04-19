import { Newspaper, ExternalLink } from "lucide-react";
import { Headline } from "@/types/stock";

interface Props {
  headlines?: Headline[];
}

function formatPublished(raw: string): string {
  if (!raw) return "";
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return raw;
  }
}

export default function NewsHeadlines({ headlines }: Props) {
  if (!headlines || headlines.length === 0) return null;

  return (
    <div className="rounded-lg bg-[var(--surface-container)] p-4 sm:p-6 transition-colors duration-200 hover:bg-[var(--surface-container-high)]">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-[var(--on-surface-variant)]" />
          <span className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-[0.14em]">
            Market intelligence
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {headlines.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-lg bg-[var(--surface-container-low)] p-4 transition-colors duration-200 hover:bg-[var(--surface-container-high)]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--on-surface)] leading-snug line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] uppercase tracking-wide">
                  {item.source}
                </span>
                {item.published && (
                  <span className="text-[11px] text-[var(--fg-subtle)]">{formatPublished(item.published)}</span>
                )}
              </div>
            </div>
            <ExternalLink
              size={14}
              className="text-[var(--on-surface-variant)] flex-shrink-0 mt-0.5 group-hover:text-[var(--primary)] transition-colors"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
