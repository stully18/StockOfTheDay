from fastapi import APIRouter, HTTPException
from scrapers.yfinance_client import get_stock_info, get_price_history
import json, os

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "today.json")


@router.get("/today")
def get_today():
    """Return today's featured stock."""
    if not os.path.exists(DATA_FILE):
        raise HTTPException(status_code=404, detail="No stock selected for today yet. Run /api/scraper/run first.")
    with open(DATA_FILE) as f:
        return json.load(f)


@router.get("/{ticker}/chart")
def get_chart(ticker: str, period: str = "1mo"):
    """Return price history for a ticker (for charting)."""
    allowed_periods = {"1d", "5d", "1mo", "3mo", "6mo", "1y"}
    if period not in allowed_periods:
        raise HTTPException(status_code=400, detail=f"Period must be one of {allowed_periods}")
    history = get_price_history(ticker, period=period)
    return {"ticker": ticker.upper(), "period": period, "data": [p.model_dump() for p in history]}


@router.get("/{ticker}/info")
def get_info(ticker: str):
    """Return fundamental info for any ticker."""
    return get_stock_info(ticker)
