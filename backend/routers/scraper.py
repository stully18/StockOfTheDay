import json
import logging
import os
import secrets
import re
from collections import Counter
from datetime import date

from fastapi import APIRouter, Header, HTTPException
from scrapers.alphavantage_client import get_overview, get_stock_info
from scrapers.rss_scraper import scrape_all_feeds
from scrapers.stocktwits_client import get_stocktwits_scores
from scrapers.write_up import generate_write_up
from scrapers.yfinance_client import get_price_history

logger = logging.getLogger(__name__)

router = APIRouter()
DATA_FILE   = os.path.join(os.path.dirname(__file__), "..", "data", "today.json")
ARCHIVE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "archive")

COOLDOWN_DAYS = 5
TICKER_RE = re.compile(r"^[A-Z]{1,5}$")
MIN_MARKET_CAP = 300_000_000  # Exclude micro/penny-like names.
MIN_DESCRIPTION_LEN = 80
MIN_PRICE = 5.0
MIN_ANALYST_COUNT = 5
MIN_RSS_MENTIONS = 2
MIN_WEEKDAY_MENTIONS = 3
EXCLUDED_EXCHANGE_MARKERS = ("OTC", "PINK", "GREY", "CRYPTO", "CURRENCY")


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _headline_relevance_score(article: dict, ticker: str, company_name: str) -> int:
    """Score article relevance to the selected stock; higher is better."""
    title = article.get("title", "")
    summary = article.get("summary", "")
    raw_text = f"{title} {summary}"
    text = f"{title} {summary}".lower()
    title_tokens = _tokenize(title)
    text_tokens = _tokenize(text)

    ticker_lower = ticker.lower()
    company_tokens = _tokenize(company_name)
    generic_company_words = {
        "inc", "incorporated", "corp", "corporation", "company", "co", "the", "plc", "ltd",
        "holdings", "holding", "group", "shares", "share", "adr", "ads", "american", "class",
    }
    meaningful_company_tokens = {
        token
        for token in company_tokens
        if token not in generic_company_words and len(token) >= 3
    }

    score = 0

    ticker_upper = ticker.upper()
    # Ticker hits are strongest, but require explicit symbol-style matches.
    explicit_ticker_hit = False
    if re.search(rf"\${re.escape(ticker_upper)}\b", title):
        score += 12
        explicit_ticker_hit = True
    elif re.search(rf"\b{re.escape(ticker_upper)}\b", title):
        score += 10
        explicit_ticker_hit = True

    if re.search(rf"\${re.escape(ticker_upper)}\b", raw_text):
        score += 8
        explicit_ticker_hit = True
    elif re.search(rf"\b{re.escape(ticker_upper)}\b", raw_text):
        score += 6
        explicit_ticker_hit = True

    # Company name token matches (title weighted higher).
    if meaningful_company_tokens:
        title_matches = meaningful_company_tokens.intersection(title_tokens)
        text_matches = meaningful_company_tokens.intersection(text_tokens)
        score += len(title_matches) * 5
        score += len(text_matches) * 2

        # Bonus when multiple distinct company tokens appear.
        if len(text_matches) >= 2:
            score += 4

    # Block weak semantic matches unless ticker appears explicitly.
    if not explicit_ticker_hit and score < 8:
        return 0

    return score


def _is_supported_ticker(ticker: str) -> bool:
    """Only allow standard equity symbols currently supported by backend routes."""
    return bool(TICKER_RE.fullmatch((ticker or "").upper()))


def _is_reputable_exchange(exchange: str) -> bool:
    """
    Accept major listed venues globally; reject OTC/grey-market style venues.
    """
    exch = (exchange or "").upper().strip()
    if not exch:
        return False
    return not any(marker in exch for marker in EXCLUDED_EXCHANGE_MARKERS)


def _is_high_quality_candidate(overview: dict) -> bool:
    """
    Ensure selected names are established, information-rich listed equities.
    """
    exchange = overview.get("exchange", "")
    market_cap = overview.get("market_cap")
    description = (overview.get("description") or "").strip()
    sector = (overview.get("sector") or "").strip().lower()
    industry = (overview.get("industry") or "").strip().lower()

    if not _is_reputable_exchange(exchange):
        return False
    if not market_cap or market_cap < MIN_MARKET_CAP:
        return False
    if len(description) < MIN_DESCRIPTION_LEN:
        return False
    if sector in {"", "unknown"} or industry in {"", "unknown"}:
        return False
    return True


def _has_strong_analyst_coverage(info: dict) -> bool:
    total = sum(
        x or 0
        for x in (
            info.get("analyst_strong_buy"),
            info.get("analyst_buy"),
            info.get("analyst_hold"),
            info.get("analyst_sell"),
            info.get("analyst_strong_sell"),
        )
    )
    return total >= MIN_ANALYST_COUNT and info.get("analyst_target_price") is not None


def _analyst_metrics(info: dict) -> tuple[int, int, int, float]:
    strong_buy = info.get("analyst_strong_buy") or 0
    buy = info.get("analyst_buy") or 0
    hold = info.get("analyst_hold") or 0
    sell = info.get("analyst_sell") or 0
    strong_sell = info.get("analyst_strong_sell") or 0
    bullish = strong_buy + buy
    total = bullish + hold + sell + strong_sell
    ratio = (bullish / total) if total > 0 else 0
    return bullish, hold, total, ratio


def _is_weekend() -> bool:
    return date.today().weekday() >= 5


def _latest_price_from_yahoo(ticker: str) -> float:
    points = get_price_history(ticker, period="5d")
    if not points:
        return 0
    return points[-1].close or 0


def _latest_bar_from_yahoo(ticker: str) -> dict:
    points = get_price_history(ticker, period="5d")
    if not points:
        return {}

    last = points[-1]
    prev = points[-2] if len(points) > 1 else None
    price_change = (last.close - prev.close) if prev else 0
    price_change_pct = ((price_change / prev.close) * 100) if prev and prev.close else 0
    return {
        "current_price": last.close,
        "day_high": last.high,
        "day_low": last.low,
        "price_change": round(price_change, 2),
        "price_change_pct": round(price_change_pct, 4),
    }


def _candidate_headline_count(ticker: str, company_name: str, all_articles: list[dict]) -> int:
    return sum(
        1
        for article in all_articles
        if _headline_relevance_score(article, ticker=ticker, company_name=company_name) > 0
    )


def _company_keyword_match_count(company_name: str, article: dict) -> int:
    tokens = _tokenize(company_name)
    generic_words = {
        "inc", "incorporated", "corp", "corporation", "company", "co", "the", "plc", "ltd",
        "holdings", "holding", "group", "shares", "share", "adr", "ads", "american", "class",
    }
    keywords = {t for t in tokens if t not in generic_words and len(t) >= 4}
    if not keywords:
        return 0
    text_tokens = _tokenize(f"{article.get('title', '')} {article.get('summary', '')}")
    return len(keywords.intersection(text_tokens))


def _passes_final_quality(
    ticker: str,
    overview: dict,
    rss_mentions: int,
    all_articles: list[dict],
) -> bool:
    """
    Final gate to block low-quality/penny-like selections while keeping API usage light.
    """
    current_price = _latest_price_from_yahoo(ticker)
    if current_price < MIN_PRICE:
        return False
    if rss_mentions < MIN_RSS_MENTIONS:
        return False
    if not _has_strong_analyst_coverage(overview):
        return False
    company_name = overview.get("company_name", ticker)
    if _candidate_headline_count(ticker=ticker, company_name=company_name, all_articles=all_articles) == 0:
        return False
    return True


def _candidate_rank_score(
    ticker: str,
    combined_mentions: int,
    overview: dict,
    rss_mentions: int,
    all_articles: list[dict],
) -> float | None:
    """
    Compute quality score for candidate selection. Higher is better.
    Returns None if candidate fails minimum quality constraints.
    """
    if not _passes_final_quality(ticker=ticker, overview=overview, rss_mentions=rss_mentions, all_articles=all_articles):
        return None

    bullish, hold, total_analysts, bullish_ratio = _analyst_metrics(overview)
    headline_hits = _candidate_headline_count(
        ticker=ticker,
        company_name=overview.get("company_name", ticker),
        all_articles=all_articles,
    )

    min_mentions = MIN_RSS_MENTIONS if _is_weekend() else MIN_WEEKDAY_MENTIONS
    min_bullish_ratio = 0.50 if _is_weekend() else 0.55
    if rss_mentions < min_mentions:
        return None
    if bullish_ratio < min_bullish_ratio:
        return None
    if bullish <= hold:
        return None

    # Weighted score prioritizes media relevance and bullish conviction.
    return (
        combined_mentions * 3.0
        + rss_mentions * 5.0
        + headline_hits * 6.0
        + bullish * 1.6
        + bullish_ratio * 40.0
        + min(total_analysts, 40) * 0.5
    )


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
    # Idempotency guard: skip if today.json already contains today's date
    today_str = str(date.today())
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE) as f:
                existing = json.load(f)
            if existing.get("date") == today_str:
                logger.info("Scrape already ran today (%s); skipping duplicate run.", today_str)
                return {"status": "skipped", "reason": "already ran today", "ticker": existing.get("ticker")}
        except Exception:
            pass

    # Step 1: RSS
    ticker_counts, all_articles = await scrape_all_feeds()

    # Step 2: merge StockTwits
    twits_scores = await get_stocktwits_scores()
    combined: Counter = Counter()
    for t, c in ticker_counts.items():
        if _is_supported_ticker(t):
            combined[t] += c
    for t, points in twits_scores.items():
        if _is_supported_ticker(t):
            combined[t] += points

    if not combined:
        combined["NVDA"] = 0

    # Step 3: pick highest-scoring quality candidate outside cooldown window
    recent = _recent_tickers(COOLDOWN_DAYS)
    ticker = None
    mention_count = 0
    info = {}
    selected_overview = {}
    scored_candidates: list[tuple[float, str, int, dict]] = []
    for t, c in combined.most_common(25):
        overview = get_overview(t)
        if not _is_high_quality_candidate(overview):
            continue
        rss_mentions = ticker_counts.get(t, 0)
        score = _candidate_rank_score(
            ticker=t,
            combined_mentions=c,
            overview=overview,
            rss_mentions=rss_mentions,
            all_articles=all_articles,
        )
        if score is not None:
            scored_candidates.append((score, t, c, overview))

    non_recent = [item for item in scored_candidates if item[1] not in recent]
    if non_recent:
        non_recent.sort(key=lambda x: x[0], reverse=True)
        _, ticker, mention_count, selected_overview = non_recent[0]

    # Relax once if needed: allow recent tickers but keep quality score.
    if ticker is None:
        if scored_candidates:
            scored_candidates.sort(key=lambda x: x[0], reverse=True)
            _, ticker, mention_count, selected_overview = scored_candidates[0]
            logger.warning("Cooldown bypassed for high-quality candidate: %s", ticker)

    # Last resort fallback: still prefer populated fundamentals + analyst + at least one related headline.
    if ticker is None:
        for t, c in combined.most_common():
            overview = get_overview(t)
            if not overview:
                continue
            rss_mentions = ticker_counts.get(t, 0)
            bullish, hold, _, _ = _analyst_metrics(overview)
            if _latest_price_from_yahoo(t) < MIN_PRICE:
                continue
            if not _has_strong_analyst_coverage(overview):
                continue
            if rss_mentions < MIN_RSS_MENTIONS:
                continue
            if bullish <= hold:
                continue
            company_name = overview.get("company_name", t)
            if _candidate_headline_count(ticker=t, company_name=company_name, all_articles=all_articles) == 0:
                continue
            ticker = t
            mention_count = c
            selected_overview = overview
            logger.warning("Strict quality filters missed all; relaxed fallback selected %s", ticker)
            break

    if ticker is None:
        # Hard fallback: pick any candidate not in recent cooldown, ignoring quality gates
        recent = _recent_tickers(COOLDOWN_DAYS)
        for t, c in combined.most_common():
            if t not in recent:
                overview = get_overview(t)
                if overview:
                    ticker = t
                    mention_count = c
                    selected_overview = overview
                    logger.warning("Emergency fallback (ignoring quality): %s", ticker)
                    break

    if ticker is None:
        logger.error("No suitable candidate found after all fallbacks; aborting scrape.")
        return {"status": "error", "reason": "no suitable candidate found"}

    logger.info("Selected ticker: %s  (combined score: %d)", ticker, mention_count)

    # Step 4: fundamentals
    info = get_stock_info(ticker)
    # Merge in overview fields if quote call succeeded but overview was rate-limited/missing.
    if selected_overview:
        for key, value in selected_overview.items():
            if info.get(key) in (None, "", "Unknown", 0):
                info[key] = value
    if (info.get("current_price") or 0) <= 0:
        info.update(_latest_bar_from_yahoo(ticker))

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

    # Step 6: top 3 highest-scoring headlines for the selected ticker/company
    company_name = info.get("company_name", "")
    scored_articles = []
    for article in all_articles:
        score = _headline_relevance_score(article, ticker=ticker, company_name=company_name)
        if score > 0:
            scored_articles.append((score, article))

    scored_articles.sort(key=lambda item: item[0], reverse=True)
    headlines = [
        {
            "title": article["title"],
            "source": article["source"],
            "link": article["link"],
            "published": article["published"],
        }
        for score, article in scored_articles[:3]
    ]
    if not headlines:
        relaxed = []
        for article in all_articles:
            company_hits = _company_keyword_match_count(company_name=company_name, article=article)
            if company_hits > 0:
                relaxed.append((company_hits, article))
        relaxed.sort(key=lambda item: item[0], reverse=True)
        headlines = [
            {
                "title": article["title"],
                "source": article["source"],
                "link": article["link"],
                "published": article["published"],
            }
            for _, article in relaxed[:3]
        ]

    # Step 7: archive previous day (skip if same ticker repeated)
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE) as f:
                prev = json.load(f)
            prev_date = prev.get("date", "unknown")
            prev_ticker = prev.get("ticker")
            if prev_date != today_str:
                if prev_ticker == ticker:
                    logger.warning(
                        "Selected ticker %s matches previous day (%s); archiving but flagging repeat.",
                        ticker, prev_date,
                    )
                os.makedirs(ARCHIVE_DIR, exist_ok=True)
                archive_path = os.path.join(ARCHIVE_DIR, f"{prev_date}.json")
                if not os.path.exists(archive_path):
                    with open(archive_path, "w") as f:
                        json.dump(prev, f)
                else:
                    logger.info("Archive entry for %s already exists; skipping overwrite.", prev_date)
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
