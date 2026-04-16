const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getTodayStock() {
  const res = await fetch(`${API_BASE}/api/stock/today`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getChartData(ticker: string, period = "1mo") {
  const res = await fetch(`${API_BASE}/api/stock/${ticker}/chart?period=${period}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getArchive(search = "") {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE}/api/archive/${params}`, { next: { revalidate: 60 } });
  if (!res.ok) return { count: 0, results: [] };
  return res.json();
}

export function formatMarketCap(value: number | null): string {
  if (!value) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
