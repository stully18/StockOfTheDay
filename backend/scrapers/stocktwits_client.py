import httpx
from collections import Counter

STOCKTWITS_URL = "https://api.stocktwits.com/api/2/trending/symbols.json"

# Points awarded by trending rank (1-indexed)
def _rank_points(rank: int) -> int:
    if rank <= 10:
        return 15
    if rank <= 20:
        return 10
    return 5


async def get_stocktwits_scores() -> Counter:
    """
    Fetch StockTwits trending symbols (no auth required).
    Returns a Counter with weighted points by rank position (top 30).
    """
    scores: Counter = Counter()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(STOCKTWITS_URL, headers={"User-Agent": "Mozilla/5.0"})
            data = resp.json()
            for rank, sym in enumerate(data.get("symbols", [])[:30], start=1):
                ticker = sym.get("symbol", "").upper()
                if ticker:
                    scores[ticker] += _rank_points(rank)
    except Exception:
        pass
    return scores
