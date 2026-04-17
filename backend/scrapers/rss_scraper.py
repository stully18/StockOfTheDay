import feedparser
import re
import httpx
from collections import Counter
from typing import List, Tuple

# RSS feeds from major finance outlets (no API keys required)
RSS_FEEDS = {
    "Yahoo Finance": "https://finance.yahoo.com/news/rssindex",
    "MarketWatch": "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines",
    "CNBC": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    "Seeking Alpha": "https://seekingalpha.com/market_currents.xml",
}

# Reddit scraping is optional — requires API credentials in backend/.env
# Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to enable it
REDDIT_ENABLED = False  # flip to True once you have Reddit API credentials

# Common words to ignore when extracting $TICKER-style mentions
STOPWORDS = {
    "A", "I", "AM", "IS", "IT", "IN", "ON", "AT", "BE", "DO", "GO",
    "US", "EU", "UK", "ETF", "CEO", "CFO", "IPO", "GDP", "CPI", "PCE",
    "FED", "SEC", "NYSE", "THE", "FOR", "AND", "BUT", "NOT", "INC",
    "LLC", "LTD", "NEW", "ALL", "TOP", "BIG", "GET", "SET", "CAN",
    "MAY", "SAY", "WAY", "DAY", "OIL", "GAS", "AI", "EV", "EST",
    "PM", "AM", "ET", "PT", "CT", "MT", "Q1", "Q2", "Q3", "Q4",
}

# Top 120 most-covered stocks: company name keywords → ticker
# Longer/more specific phrases must come before shorter ones
COMPANY_TO_TICKER: List[Tuple[str, str]] = [
    # Mega-cap tech
    ("nvidia", "NVDA"), ("nvda", "NVDA"),
    ("apple", "AAPL"), ("aapl", "AAPL"),
    ("microsoft", "MSFT"), ("msft", "MSFT"),
    ("alphabet", "GOOGL"), ("google", "GOOGL"), ("googl", "GOOGL"),
    ("amazon", "AMZN"), ("amzn", "AMZN"),
    ("meta platforms", "META"), ("meta", "META"),
    ("tesla", "TSLA"), ("tsla", "TSLA"),
    ("broadcom", "AVGO"), ("avgo", "AVGO"),
    ("taiwan semiconductor", "TSM"), ("tsmc", "TSM"), ("tsm", "TSM"),
    ("samsung", "SSNLF"),
    # Finance
    ("jpmorgan", "JPM"), ("jp morgan", "JPM"), ("jpm", "JPM"),
    ("berkshire hathaway", "BRK"), ("berkshire", "BRK"),
    ("visa", "V"),
    ("mastercard", "MA"),
    ("goldman sachs", "GS"), ("goldman", "GS"),
    ("morgan stanley", "MS"),
    ("bank of america", "BAC"), ("bofa", "BAC"), ("bac", "BAC"),
    ("wells fargo", "WFC"), ("wfc", "WFC"),
    ("citigroup", "C"), ("citi", "C"),
    ("american express", "AXP"), ("amex", "AXP"),
    ("blackrock", "BLK"), ("blk", "BLK"),
    # Healthcare / pharma
    ("unitedhealth", "UNH"), ("unh", "UNH"),
    ("eli lilly", "LLY"), ("lilly", "LLY"), ("lly", "LLY"),
    ("johnson & johnson", "JNJ"), ("j&j", "JNJ"), ("jnj", "JNJ"),
    ("abbvie", "ABBV"), ("abbv", "ABBV"),
    ("pfizer", "PFE"), ("pfe", "PFE"),
    ("merck", "MRK"), ("mrk", "MRK"),
    ("novo nordisk", "NVO"), ("nvo", "NVO"),
    ("thermo fisher", "TMO"), ("tmo", "TMO"),
    ("abbott", "ABT"), ("abt", "ABT"),
    # Consumer
    ("walmart", "WMT"), ("wmt", "WMT"),
    ("costco", "COST"), ("cost", "COST"),
    ("home depot", "HD"), ("hd", "HD"),
    ("nike", "NKE"), ("nke", "NKE"),
    ("mcdonald", "MCD"), ("mcd", "MCD"),
    ("starbucks", "SBUX"), ("sbux", "SBUX"),
    ("coca-cola", "KO"), ("coca cola", "KO"), ("ko", "KO"),
    ("pepsi", "PEP"), ("pepsico", "PEP"), ("pep", "PEP"),
    ("procter & gamble", "PG"), ("procter and gamble", "PG"), ("p&g", "PG"),
    ("target", "TGT"), ("tgt", "TGT"),
    # Semiconductors / hardware
    ("advanced micro", "AMD"), ("amd", "AMD"),
    ("intel", "INTC"), ("intc", "INTC"),
    ("qualcomm", "QCOM"), ("qcom", "QCOM"),
    ("arm holdings", "ARM"), ("arm", "ARM"),
    ("micron", "MU"), ("mu", "MU"),
    ("applied materials", "AMAT"), ("amat", "AMAT"),
    ("asml", "ASML"),
    # Software / cloud
    ("salesforce", "CRM"), ("crm", "CRM"),
    ("oracle", "ORCL"), ("orcl", "ORCL"),
    ("servicenow", "NOW"), ("now", "NOW"),
    ("palantir", "PLTR"), ("pltr", "PLTR"),
    ("snowflake", "SNOW"), ("snow", "SNOW"),
    ("datadog", "DDOG"), ("ddog", "DDOG"),
    ("crowdstrike", "CRWD"), ("crwd", "CRWD"),
    ("mongodb", "MDB"), ("mdb", "MDB"),
    ("adobe", "ADBE"), ("adbe", "ADBE"),
    ("workday", "WDAY"), ("wday", "WDAY"),
    ("palo alto", "PANW"), ("panw", "PANW"),
    # Streaming / media
    ("netflix", "NFLX"), ("nflx", "NFLX"),
    ("spotify", "SPOT"), ("spot", "SPOT"),
    ("disney", "DIS"), ("dis", "DIS"),
    ("comcast", "CMCSA"), ("cmcsa", "CMCSA"),
    # EV / auto
    ("rivian", "RIVN"), ("rivn", "RIVN"),
    ("lucid", "LCID"), ("lcid", "LCID"),
    ("ford", "F"),
    ("general motors", "GM"), ("gm", "GM"),
    ("toyota", "TM"), ("tm", "TM"),
    # Energy
    ("exxon", "XOM"), ("xom", "XOM"),
    ("chevron", "CVX"), ("cvx", "CVX"),
    ("conocophillips", "COP"), ("cop", "COP"),
    # Telecom
    ("at&t", "T"),
    ("verizon", "VZ"), ("vz", "VZ"),
    ("t-mobile", "TMUS"), ("tmobile", "TMUS"), ("tmus", "TMUS"),
    # Other high-coverage
    ("uber", "UBER"), ("uber", "UBER"),
    ("airbnb", "ABNB"), ("abnb", "ABNB"),
    ("shopify", "SHOP"), ("shop", "SHOP"),
    ("coinbase", "COIN"), ("coin", "COIN"),
    ("robinhood", "HOOD"), ("hood", "HOOD"),
    ("block", "SQ"), ("square", "SQ"), ("sq", "SQ"),
    ("paypal", "PYPL"), ("pypl", "PYPL"),
    ("intuit", "INTU"), ("intu", "INTU"),
    ("amd", "AMD"),
    ("boeing", "BA"), ("ba", "BA"),
    ("lockheed", "LMT"), ("lmt", "LMT"),
    ("caterpillar", "CAT"), ("cat", "CAT"),
    ("3m", "MMM"), ("mmm", "MMM"),
    ("openai", "MSFT"),  # OpenAI news often moves MSFT
    ("anthropic", "AMZN"),  # Anthropic investment news moves AMZN
]


def extract_tickers(text: str) -> List[str]:
    """
    Extract ticker symbols two ways:
    1. Explicit $TICKER format (e.g. $NVDA)
    2. Company name keyword matching against COMPANY_TO_TICKER lookup
    """
    found: List[str] = []
    lower = text.lower()

    # Method 1: $TICKER pattern
    for match in re.finditer(r'\$([A-Z]{1,5})\b', text):
        ticker = match.group(1)
        if ticker not in STOPWORDS:
            found.append(ticker)

    # Method 2: company name lookup (longer phrases first to avoid partial matches)
    for name, ticker in COMPANY_TO_TICKER:
        if name in lower:
            found.append(ticker)

    return found


async def fetch_feed(name: str, url: str) -> List[dict]:
    """Fetch and parse a single RSS feed, returning up to 25 entries."""
    try:
        async with httpx.AsyncClient(timeout=12) as client:
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
                for entry in feed.entries[:25]
            ]
    except Exception:
        return []


async def scrape_all_feeds() -> Tuple[Counter, List[dict]]:
    """
    Scrape all RSS feeds, tally ticker mentions,
    and return (ticker_counts, all_articles).
    Top-ticker selection is left to the caller so signals can be merged first.
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

    return (ticker_counts, all_articles)
