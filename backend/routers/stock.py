from fastapi import APIRouter, HTTPException
from scrapers.yfinance_client import get_price_history
from scrapers.alphavantage_client import get_stock_info
import json, os

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "today.json")


@router.get("/today")
def get_today():
    """Return today's featured stock."""
    if not os.path.exists(DATA_FILE):
        raise HTTPException(
            status_code=404,
            detail="No stock selected for today yet. Run /api/scraper/run first."
        )
    with open(DATA_FILE) as f:
        return json.load(f)


@router.get("/{ticker}/chart")
def get_chart(ticker: str, period: str = "1mo"):
    """Return OHLCV price history for charting (Yahoo Finance chart API)."""
    allowed_periods = {"1d", "5d", "1mo", "3mo", "6mo", "1y"}
    if period not in allowed_periods:
        raise HTTPException(status_code=400, detail=f"Period must be one of {allowed_periods}")
    history = get_price_history(ticker, period=period)
    return {"ticker": ticker.upper(), "period": period, "data": [p.model_dump() for p in history]}


@router.get("/{ticker}/info")
def get_info(ticker: str):
    """Return fundamentals + analyst ratings for any ticker (Alpha Vantage)."""
    return get_stock_info(ticker)
