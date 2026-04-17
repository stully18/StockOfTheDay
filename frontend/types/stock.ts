export interface Headline {
  title: string;
  source: string;
  link: string;
  published: string;
}

export interface StockOfTheDay {
  ticker: string;
  company_name: string;
  date: string;
  sector: string;
  industry: string;
  description: string;
  why_featured: string;
  mention_count: number;

  // Price
  current_price: number;
  day_high: number;
  day_low: number;
  week_52_high: number;
  week_52_low: number;
  price_change: number | null;
  price_change_pct: number | null;

  // Fundamentals
  market_cap: number | null;
  pe_ratio: number | null;
  moving_avg_50: number | null;
  moving_avg_200: number | null;

  // Analyst ratings
  analyst_target_price: number | null;
  analyst_strong_buy: number | null;
  analyst_buy: number | null;
  analyst_hold: number | null;
  analyst_sell: number | null;
  analyst_strong_sell: number | null;

  // News headlines
  headlines?: Headline[];
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
