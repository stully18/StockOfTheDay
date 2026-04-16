import httpx
import json
import os
from datetime import date
from typing import Optional

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
BASE_URL = "https://www.alphavantage.co/query"
CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "av_cache.json")


# ---------------------------------------------------------------------------
# Cache helpers (date-keyed per ticker, invalidates each calendar day)
# ---------------------------------------------------------------------------

def _load_cache() -> dict:
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE) as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_cache(cache: dict):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def _cache_get(ticker: str, key: str) -> Optional[dict]:
    cache = _load_cache()
    today = str(date.today())
    entry = cache.get(ticker.upper(), {})
    if entry.get("date") == today and key in entry:
        return entry[key]
    return None


def _cache_set(ticker: str, key: str, data: dict):
    cache = _load_cache()
    today = str(date.today())
    t = ticker.upper()
    if cache.get(t, {}).get("date") != today:
        cache[t] = {"date": today}
    cache[t][key] = data
    _save_cache(cache)


# ---------------------------------------------------------------------------
# Type coercions
# ---------------------------------------------------------------------------

def _float(val) -> Optional[float]:
    try:
        if val and str(val).strip() not in ("", "None", "-", "N/A"):
            return float(val)
    except (ValueError, TypeError):
        pass
    return None


def _int(val) -> Optional[int]:
    try:
        if val and str(val).strip() not in ("", "None", "-", "N/A"):
            return int(float(val))
    except (ValueError, TypeError):
        pass
    return None


# ---------------------------------------------------------------------------
# API calls
# ---------------------------------------------------------------------------

def get_overview(ticker: str) -> dict:
    """
    Fetch company overview + analyst ratings from Alpha Vantage OVERVIEW endpoint.
    Returns fundamentals, 52-week range, moving averages, and analyst rating counts.
    Results are cached for the calendar day to conserve the 25 req/day free limit.
    """
    cached = _cache_get(ticker, "overview")
    if cached is not None:
        return cached

    try:
        with httpx.Client(timeout=15) as client:
            r = client.get(BASE_URL, params={
                "function": "OVERVIEW",
                "symbol": ticker.upper(),
                "apikey": API_KEY,
            })
            r.raise_for_status()
            data = r.json()

        if not data or "Symbol" not in data:
            return {}

        result = {
            "company_name":        data.get("Name", ticker.upper()),
            "description":         data.get("Description", ""),
            "sector":              data.get("Sector", "Unknown").title(),
            "industry":            data.get("Industry", "Unknown").title(),
            "market_cap":          _float(data.get("MarketCapitalization")),
            "pe_ratio":            _float(data.get("PERatio")),
            "week_52_high":        _float(data.get("52WeekHigh")) or 0,
            "week_52_low":         _float(data.get("52WeekLow")) or 0,
            "moving_avg_50":       _float(data.get("50DayMovingAverage")),
            "moving_avg_200":      _float(data.get("200DayMovingAverage")),
            "analyst_target_price":    _float(data.get("AnalystTargetPrice")),
            "analyst_strong_buy":      _int(data.get("AnalystRatingStrongBuy")),
            "analyst_buy":             _int(data.get("AnalystRatingBuy")),
            "analyst_hold":            _int(data.get("AnalystRatingHold")),
            "analyst_sell":            _int(data.get("AnalystRatingSell")),
            "analyst_strong_sell":     _int(data.get("AnalystRatingStrongSell")),
        }
        _cache_set(ticker, "overview", result)
        return result
    except Exception:
        return {}


def get_quote(ticker: str) -> dict:
    """
    Fetch current price, day high/low, and daily change from Alpha Vantage GLOBAL_QUOTE.
    Results are cached for the calendar day.
    """
    cached = _cache_get(ticker, "quote")
    if cached is not None:
        return cached

    try:
        with httpx.Client(timeout=15) as client:
            r = client.get(BASE_URL, params={
                "function": "GLOBAL_QUOTE",
                "symbol": ticker.upper(),
                "apikey": API_KEY,
            })
            r.raise_for_status()
            data = r.json().get("Global Quote", {})

        if not data or not data.get("05. price"):
            return {}

        change_pct_raw = data.get("10. change percent", "0%").replace("%", "").strip()
        result = {
            "current_price":    _float(data.get("05. price")) or 0,
            "day_high":         _float(data.get("03. high")) or 0,
            "day_low":          _float(data.get("04. low")) or 0,
            "price_change":     _float(data.get("09. change")) or 0,
            "price_change_pct": _float(change_pct_raw) or 0,
        }
        _cache_set(ticker, "quote", result)
        return result
    except Exception:
        return {}


def get_stock_info(ticker: str) -> dict:
    """
    Combined overview + quote. Returns a flat dict suitable for StockOfTheDay model.
    Falls back gracefully — missing fields become None/0 rather than raising.
    Inserts a 12-second pause between calls when both need to be fetched fresh
    to stay within Alpha Vantage's 5 req/min free-tier rate limit.
    """
    import time
    overview_cached = _cache_get(ticker, "overview") is not None
    quote_cached    = _cache_get(ticker, "quote")    is not None

    overview = get_overview(ticker)
    if not overview_cached and not quote_cached:
        time.sleep(12)          # rate limit: 5 req/min on free tier
    quote    = get_quote(ticker)

    # Merge; quote values win for price fields
    merged = {
        "ticker": ticker.upper(),
        # Fundamentals from overview
        "company_name":         overview.get("company_name", ticker.upper()),
        "description":          overview.get("description", ""),
        "sector":               overview.get("sector", "Unknown"),
        "industry":             overview.get("industry", "Unknown"),
        "market_cap":           overview.get("market_cap"),
        "pe_ratio":             overview.get("pe_ratio"),
        "week_52_high":         overview.get("week_52_high") or 0,
        "week_52_low":          overview.get("week_52_low") or 0,
        "moving_avg_50":        overview.get("moving_avg_50"),
        "moving_avg_200":       overview.get("moving_avg_200"),
        "analyst_target_price": overview.get("analyst_target_price"),
        "analyst_strong_buy":   overview.get("analyst_strong_buy"),
        "analyst_buy":          overview.get("analyst_buy"),
        "analyst_hold":         overview.get("analyst_hold"),
        "analyst_sell":         overview.get("analyst_sell"),
        "analyst_strong_sell":  overview.get("analyst_strong_sell"),
        # Live price from quote
        "current_price":    quote.get("current_price") or 0,
        "day_high":         quote.get("day_high") or 0,
        "day_low":          quote.get("day_low") or 0,
        "price_change":     quote.get("price_change") or 0,
        "price_change_pct": quote.get("price_change_pct") or 0,
    }
    return merged
