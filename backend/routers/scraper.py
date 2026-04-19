import json
import logging
import os
import secrets
from collections import Counter
from datetime import date

from fastapi import APIRouter, Header, HTTPException
from scrapers.alphavantage_client import get_stock_info
from scrapers.rss_scraper import scrape_all_feeds
from scrapers.stocktwits_client import get_stocktwits_scores
from scrapers.write_up import generate_write_up

logger = logging.getLogger(__name__)

router = APIRouter()
DATA_FILE   = os.path.join(os.path.dirname(__file__), "..", "data", "today.json")
ARCHIVE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "archive")

COOLDOWN_DAYS = 5


def _recent_tickers(n: int = COOLDOWN_DAYS) -> set:
    """Return tickers from the last n archive entries (by filename sort)."""
    if not os.path.exists(ARCHIVE_DIR):
        return set()
    files = sorted(
        [f for f in os.listdir(ARCHIVE_DIR) if f.endswith(".json")],
        reverse=True,
    )[:n]
    tickers = set()
    for fname in files:
        try:
            with open(os.path.join(ARCHIVE_DIR, fname)) as f:
                entry = json.load(f)
            if "ticker" in entry:
                tickers.add(entry["ticker"])
        except Exception:
            pass
    return tickers


async def run_daily_scrape() -> dict:
    """
    Full daily pipeline:
    1. Scrape RSS feeds → ticker_counts + articles
    2. Merge StockTwits trending scores (weighted by rank)
    3. Apply 5-day cooldown — skip recently featured tickers
    4. Fetch fundamentals + analyst ratings from Alpha Vantage
    5. Generate AI write-up
    6. Collect top 5 headlines mentioning the selected ticker
    7. Archive previous day, save today.json
    """
    # Step 1: RSS
    ticker_counts, all_articles = await scrape_all_feeds()

    # Step 2: merge StockTwits
    twits_scores = await get_stocktwits_scores()
    combined: Counter = Counter(ticker_counts)
    for ticker, points in twits_scores.items():
        combined[ticker] += points

    if not combined:
        combined["NVDA"] = 0

    # Step 3: cooldown — pick highest-ranked ticker not seen in last 5 days
    recent = _recent_tickers(COOLDOWN_DAYS)
    ticker = None
    mention_count = 0
    for t, c in combined.most_common():
        if t not in recent:
            ticker = t
            mention_count = c
            break
    if ticker is None:
        ticker, mention_count = combined.most_common(1)[0]
        logger.warning("All top tickers on cooldown — cooldown bypassed, using #1: %s", ticker)

    logger.info("Selected ticker: %s  (combined score: %d)", ticker, mention_count)

    # Step 4: fundamentals
    info = get_stock_info(ticker)

    # Step 5: write-up
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

    # Step 6: top 5 headlines mentioning the selected ticker or company
    ticker_lower   = ticker.lower()
    company_lower  = info.get("company_name", "").lower()
    headlines = []
    for article in all_articles:
        text = f"{article['title']} {article.get('summary', '')}".lower()
        if ticker_lower in text or (company_lower and company_lower in text):
            headlines.append({
                "title":     article["title"],
                "source":    article["source"],
                "link":      article["link"],
                "published": article["published"],
            })
        if len(headlines) == 5:
            break

    # Step 7: archive previous day
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

    payload = {
        **info,
        "date":          str(date.today()),
        "mention_count": mention_count,
        "why_featured":  why,
        "headlines":     headlines,
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


_SCRAPER_SECRET = os.getenv("SCRAPER_SECRET", "")


@router.post("/run")
async def run_scraper(x_scraper_secret: str = Header(default="")):
    if _SCRAPER_SECRET and not secrets.compare_digest(x_scraper_secret, _SCRAPER_SECRET):
        raise HTTPException(status_code=403, detail="Forbidden")
    return await run_daily_scrape()
