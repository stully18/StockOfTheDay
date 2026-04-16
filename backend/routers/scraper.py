from fastapi import APIRouter
from scrapers.rss_scraper import scrape_all_feeds
from scrapers.alphavantage_client import get_stock_info
from scrapers.write_up import generate_write_up
from datetime import date
import json, os

router = APIRouter()
DATA_FILE    = os.path.join(os.path.dirname(__file__), "..", "data", "today.json")
ARCHIVE_DIR  = os.path.join(os.path.dirname(__file__), "..", "data", "archive")


@router.post("/run")
async def run_scraper():
    """
    Full daily pipeline:
    1. Scrape RSS feeds and tally ticker mentions
    2. Fetch fundamentals + analyst ratings from Alpha Vantage
    3. Generate smart write-up
    4. Archive yesterday's stock (if present)
    5. Save today's stock to data/today.json
    """
    # Step 1: scrape
    ticker, mention_count, articles = await scrape_all_feeds()

    # Step 2: fundamentals + analyst data
    info = get_stock_info(ticker)

    # Step 3: write-up
    why = generate_write_up(
        ticker=ticker,
        company_name=info.get("company_name", ticker),
        sector=info.get("sector", "Unknown"),
        industry=info.get("industry", "Unknown"),
        mention_count=mention_count,
        current_price=info.get("current_price", 0),
        analyst_target_price=info.get("analyst_target_price"),
        analyst_strong_buy=info.get("analyst_strong_buy"),
        analyst_buy=info.get("analyst_buy"),
        analyst_hold=info.get("analyst_hold"),
        analyst_sell=info.get("analyst_sell"),
        analyst_strong_sell=info.get("analyst_strong_sell"),
        moving_avg_50=info.get("moving_avg_50"),
        moving_avg_200=info.get("moving_avg_200"),
        price_change_pct=info.get("price_change_pct"),
    )

    # Step 4: archive previous day
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE) as f:
                prev = json.load(f)
            os.makedirs(ARCHIVE_DIR, exist_ok=True)
            archive_path = os.path.join(ARCHIVE_DIR, f"{prev.get('date', 'unknown')}.json")
            with open(archive_path, "w") as f:
                json.dump(prev, f)
        except Exception:
            pass

    # Step 5: save today
    payload = {
        **info,
        "date":          str(date.today()),
        "mention_count": mention_count,
        "why_featured":  why,
    }

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(payload, f, indent=2)

    return {
        "status":        "ok",
        "ticker":        ticker,
        "mention_count": mention_count,
        "company":       info.get("company_name", ticker),
    }
