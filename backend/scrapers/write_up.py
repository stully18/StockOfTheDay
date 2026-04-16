"""
Template-based write-up generator for Stock of the Day.

Produces a 2-3 sentence analysis using available data.
Designed to be swapped for an AI-powered version later — just replace
generate_write_up() with an API call to whichever model you choose.
"""

from typing import Optional, List


def _analyst_consensus(
    strong_buy: Optional[int],
    buy: Optional[int],
    hold: Optional[int],
    sell: Optional[int],
    strong_sell: Optional[int],
) -> tuple[str, int, int]:
    """
    Returns (consensus_label, total_analysts, bullish_count).
    consensus_label: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Mixed"
    """
    sb  = strong_buy  or 0
    b   = buy         or 0
    h   = hold        or 0
    s   = sell        or 0
    ss  = strong_sell or 0
    total = sb + b + h + s + ss
    if total == 0:
        return ("Unknown", 0, 0)

    bullish   = sb + b
    bearish   = s + ss
    bull_pct  = bullish / total

    if bull_pct >= 0.70:
        label = "Strong Buy"
    elif bull_pct >= 0.55:
        label = "Buy"
    elif bearish / total >= 0.40:
        label = "Sell"
    else:
        label = "Hold"

    return (label, total, bullish)


def generate_write_up(
    ticker: str,
    company_name: str,
    sector: str,
    industry: str,
    mention_count: int,
    current_price: float,
    analyst_target_price: Optional[float] = None,
    analyst_strong_buy: Optional[int] = None,
    analyst_buy: Optional[int] = None,
    analyst_hold: Optional[int] = None,
    analyst_sell: Optional[int] = None,
    analyst_strong_sell: Optional[int] = None,
    moving_avg_50: Optional[float] = None,
    moving_avg_200: Optional[float] = None,
    price_change_pct: Optional[float] = None,
    top_headlines: Optional[List[str]] = None,
) -> str:
    sentences: List[str] = []

    # --- Sentence 1: Why it's featured (news volume) ---
    if mention_count >= 30:
        coverage = "dominated"
    elif mention_count >= 15:
        coverage = "led"
    else:
        coverage = "appeared across"

    sentences.append(
        f"{company_name} ({ticker}) {coverage} finance headlines today, "
        f"surfacing in {mention_count} articles across major news outlets."
    )

    # --- Sentence 2: Analyst sentiment + price target ---
    consensus, total_analysts, bullish_count = _analyst_consensus(
        analyst_strong_buy, analyst_buy, analyst_hold, analyst_sell, analyst_strong_sell
    )

    if total_analysts > 0 and consensus != "Unknown":
        if consensus in ("Strong Buy", "Buy"):
            sentiment_phrase = (
                f"Wall Street leans bullish, with {bullish_count} of {total_analysts} "
                f"analysts rating the stock a Buy or Strong Buy"
            )
        elif consensus == "Sell":
            bearish = (analyst_sell or 0) + (analyst_strong_sell or 0)
            sentiment_phrase = (
                f"Analysts are cautious, with {bearish} of {total_analysts} "
                f"carrying a Sell or Strong Sell rating"
            )
        else:
            sentiment_phrase = (
                f"Analyst opinion is split across {total_analysts} covering analysts"
            )

        if analyst_target_price and current_price > 0:
            upside = ((analyst_target_price - current_price) / current_price) * 100
            direction = "upside" if upside >= 0 else "downside"
            target_phrase = (
                f", and the consensus price target of ${analyst_target_price:.2f} "
                f"implies {abs(upside):.1f}% {direction} from current levels."
            )
        else:
            target_phrase = "."

        sentences.append(sentiment_phrase + target_phrase)

    # --- Sentence 3: Technical position vs moving averages ---
    if moving_avg_50 and moving_avg_200 and current_price > 0:
        above_50  = current_price > moving_avg_50
        above_200 = current_price > moving_avg_200

        if above_50 and above_200:
            sentences.append(
                f"Shares are trading above both the 50-day (${moving_avg_50:.2f}) and "
                f"200-day (${moving_avg_200:.2f}) moving averages, a technically constructive setup."
            )
        elif not above_50 and not above_200:
            sentences.append(
                f"Shares sit below both the 50-day (${moving_avg_50:.2f}) and "
                f"200-day (${moving_avg_200:.2f}) moving averages, reflecting near-term pressure."
            )
        elif above_50 and not above_200:
            sentences.append(
                f"The stock has reclaimed its 50-day moving average (${moving_avg_50:.2f}) "
                f"but remains below the 200-day (${moving_avg_200:.2f}), a key recovery level to watch."
            )
        else:
            sentences.append(
                f"Trading below the 50-day (${moving_avg_50:.2f}) but above the longer-term "
                f"200-day (${moving_avg_200:.2f}) average suggests a short-term pullback within a broader uptrend."
            )
    elif price_change_pct is not None:
        direction = "up" if price_change_pct >= 0 else "down"
        sentences.append(
            f"The stock is {direction} {abs(price_change_pct):.2f}% on the session, "
            f"contributing to the elevated news volume."
        )

    # --- Closing: sector context ---
    sentences.append(
        f"{company_name} operates in {industry} within the {sector} sector — "
        f"a space that continues to attract significant investor and media attention."
    )

    return " ".join(sentences)
