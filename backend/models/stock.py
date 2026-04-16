from pydantic import BaseModel
from typing import Optional
from datetime import date


class StockOfTheDay(BaseModel):
    ticker: str
    company_name: str
    date: date
    sector: str
    industry: str
    description: str
    why_featured: str
    mention_count: int

    # Price
    current_price: float
    day_high: float
    day_low: float
    week_52_high: float
    week_52_low: float
    price_change: Optional[float] = None
    price_change_pct: Optional[float] = None

    # Fundamentals
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    moving_avg_50: Optional[float] = None
    moving_avg_200: Optional[float] = None

    # Analyst ratings
    analyst_target_price: Optional[float] = None
    analyst_strong_buy: Optional[int] = None
    analyst_buy: Optional[int] = None
    analyst_hold: Optional[int] = None
    analyst_sell: Optional[int] = None
    analyst_strong_sell: Optional[int] = None


class PricePoint(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class NewsArticle(BaseModel):
    title: str
    source: str
    url: str
    published: str
    summary: Optional[str] = None


class ArchiveEntry(BaseModel):
    ticker: str
    company_name: str
    date: date
    sector: str
    why_featured: str
    current_price: float
