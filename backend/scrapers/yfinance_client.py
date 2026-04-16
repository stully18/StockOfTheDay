import yfinance as yf
from typing import List
from models.stock import PricePoint


def get_stock_info(ticker: str) -> dict:
    """Fetch fundamental info for a ticker."""
    stock = yf.Ticker(ticker)
    info = stock.info
    return {
        "ticker": ticker.upper(),
        "company_name": info.get("longName", ticker),
        "sector": info.get("sector", "Unknown"),
        "industry": info.get("industry", "Unknown"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice", 0),
        "day_high": info.get("dayHigh", 0),
        "day_low": info.get("dayLow", 0),
        "week_52_high": info.get("fiftyTwoWeekHigh", 0),
        "week_52_low": info.get("fiftyTwoWeekLow", 0),
        "description": info.get("longBusinessSummary", ""),
    }


def get_price_history(ticker: str, period: str = "1mo", interval: str = "1d") -> List[PricePoint]:
    """Fetch OHLCV price history for charting."""
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period, interval=interval)
    points = []
    for ts, row in hist.iterrows():
        points.append(PricePoint(
            timestamp=ts.isoformat(),
            open=round(row["Open"], 2),
            high=round(row["High"], 2),
            low=round(row["Low"], 2),
            close=round(row["Close"], 2),
            volume=int(row["Volume"]),
        ))
    return points
