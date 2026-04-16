import feedparser
import re
import httpx
from collections import Counter
from typing import List, Tuple

# RSS feeds from major finance outlets
RSS_FEEDS = {
    "Yahoo Finance": "https://finance.yahoo.com/news/rssindex",
    "MarketWatch": "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines",
    "CNBC": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    "Seeking Alpha": "https://seekingalpha.com/market_currents.xml",
}

# Regex to extract ticker symbols (1-5 uppercase letters, often in parentheses or preceded by $)
TICKER_PATTERN = re.compile(r'\$([A-Z]{1,5})\b|\b([A-Z]{1,5})\s+(?:stock|shares|NYSE|NASDAQ|Inc\.|Corp\.)', re.IGNORECASE)

# Common words to filter out false positives
STOPWORDS = {
    "A", "I", "AM", "IS", "IT", "IN", "ON", "AT", "BE", "DO", "GO",
    "US", "US", "EU", "UK", "ETF", "CEO", "CFO", "IPO", "GDP", "CPI",
    "FED", "SEC", "NYSE", "THE", "FOR", "AND", "BUT", "NOT", "INC",
    "LLC", "LTD", "NEW", "ALL", "TOP", "BIG", "GET", "SET", "CAN",
    "MAY", "SAY", "WAY", "DAY", "OIL", "GAS", "AI",
}


def extract_tickers(text: str) -> List[str]:
    """Extract potential ticker symbols from text."""
    tickers = []
    for match in re.finditer(r'\$([A-Z]{1,5})\b', text):
        ticker = match.group(1)
        if ticker not in STOPWORDS:
            tickers.append(ticker)
    return tickers


async def fetch_feed(name: str, url: str) -> List[dict]:
    """Fetch and parse a single RSS feed."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            feed = feedparser.parse(response.text)
            return [
                {
                    "title": entry.get("title", ""),
                    "summary": entry.get("summary", ""),
                    "link": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "source": name,
                }
                for entry in feed.entries[:20]
            ]
    except Exception:
        return []


async def scrape_all_feeds() -> Tuple[str, int, List[dict]]:
    """
    Scrape all RSS feeds, tally ticker mentions,
    and return (top_ticker, mention_count, articles).
    """
    import asyncio
    tasks = [fetch_feed(name, url) for name, url in RSS_FEEDS.items()]
    results = await asyncio.gather(*tasks)

    all_articles = [article for feed in results for article in feed]
    ticker_counts: Counter = Counter()

    for article in all_articles:
        combined = f"{article['title']} {article['summary']}"
        for ticker in extract_tickers(combined):
            ticker_counts[ticker] += 1

    if not ticker_counts:
        return ("AAPL", 0, all_articles)

    top_ticker, count = ticker_counts.most_common(1)[0]
    return (top_ticker, count, all_articles)
