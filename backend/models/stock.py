from pydantic import BaseModel
from typing import Optional
from datetime import date


class StockOfTheDay(BaseModel):
    ticker: str
    company_name: str
    date: date
    sector: str
    industry: str
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    current_price: float
    day_high: float
    day_low: float
    week_52_high: float
    week_52_low: float
    description: str
    why_featured: str
    mention_count: int


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
