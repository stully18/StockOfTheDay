export interface StockOfTheDay {
  ticker: string;
  company_name: string;
  date: string;
  sector: string;
  industry: string;
  market_cap: number | null;
  pe_ratio: number | null;
  current_price: number;
  day_high: number;
  day_low: number;
  week_52_high: number;
  week_52_low: number;
  description: string;
  why_featured: string;
  mention_count: number;
}

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  ticker: string;
  period: string;
  data: PricePoint[];
}

export interface ArchiveEntry {
  ticker: string;
  company_name: string;
  date: string;
  sector: string;
  why_featured: string;
  current_price: number;
}
