from fastapi import APIRouter
from scrapers.rss_scraper import scrape_all_feeds
from scrapers.yfinance_client import get_stock_info
from datetime import date
import json, os

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "today.json")


@router.post("/run")
async def run_scraper():
    """Run the daily scraper: find top ticker and cache the result."""
    ticker, mention_count, articles = await scrape_all_feeds()
    info = get_stock_info(ticker)

    # Build a simple "why featured" summary
    why = (
        f"{info['company_name']} ({ticker}) was the most-discussed stock across major "
        f"finance outlets today, appearing in {mention_count} news items. "
        f"It operates in the {info['sector']} sector ({info['industry']})."
    )

    payload = {**info, "date": str(date.today()), "mention_count": mention_count, "why_featured": why}

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(payload, f)

    return {"status": "ok", "ticker": ticker, "mention_count": mention_count}
