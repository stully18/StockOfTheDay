import httpx
import time
from typing import List
from models.stock import PricePoint

# Map period → correct Yahoo Finance interval for clean chart data
PERIOD_INTERVAL = {
    "1d":  "5m",
    "5d":  "15m",
    "1mo": "1d",
    "3mo": "1d",
    "6mo": "1d",
    "1y":  "1wk",
}

CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
CHART_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}


def get_price_history(ticker: str, period: str = "1mo") -> List[PricePoint]:
    """
    Fetch OHLCV history via Yahoo Finance chart API.
    No authentication required — reliable and not rate-limited.
    """
    interval = PERIOD_INTERVAL.get(period, "1d")
    url      = CHART_BASE.format(ticker=ticker.upper())
    params   = {"interval": interval, "range": period}

    for attempt in range(3):
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(url, params=params, headers=CHART_HEADERS)
                resp.raise_for_status()
                payload = resp.json()

            result     = payload["chart"]["result"][0]
            timestamps = result["timestamp"]
            quotes     = result["indicators"]["quote"][0]

            opens   = quotes.get("open",   [])
            highs   = quotes.get("high",   [])
            lows    = quotes.get("low",    [])
            closes  = quotes.get("close",  [])
            volumes = quotes.get("volume", [])

            points = []
            from datetime import datetime, timezone
            for i, ts in enumerate(timestamps):
                if closes[i] is None:
                    continue
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                points.append(PricePoint(
                    timestamp=dt.isoformat(),
                    open=round(opens[i] or closes[i], 2),
                    high=round(highs[i] or closes[i], 2),
                    low=round(lows[i] or closes[i], 2),
                    close=round(closes[i], 2),
                    volume=int(volumes[i] or 0),
                ))
            return points

        except Exception:
            if attempt < 2:
                time.sleep(2 ** attempt)

    return []
