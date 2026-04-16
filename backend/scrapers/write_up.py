"""
AI-powered write-up generator for Stock of the Day.
Uses Google Gemini Flash (free tier: 1,500 req/day).
Falls back to a data-driven template if the API call fails.
"""

import os
from typing import Optional, List


# ---------------------------------------------------------------------------
# Gemini AI write-up
# ---------------------------------------------------------------------------

def _gemini_write_up(prompt: str) -> Optional[str]:
    """Call Gemini Flash and return the generated text, or None on failure."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GOOGLE_AI_API_KEY", "")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        model  = genai.GenerativeModel("gemini-2.5-flash")
        result = model.generate_content(prompt)
        return result.text.strip()
    except Exception:
        return None


def _build_prompt(
    ticker: str,
    company_name: str,
    sector: str,
    industry: str,
    mention_count: int,
    current_price: float,
    analyst_target_price: Optional[float],
    analyst_strong_buy: Optional[int],
    analyst_buy: Optional[int],
    analyst_hold: Optional[int],
    analyst_sell: Optional[int],
    analyst_strong_sell: Optional[int],
    moving_avg_50: Optional[float],
    moving_avg_200: Optional[float],
    price_change_pct: Optional[float],
    top_headlines: Optional[List[str]],
) -> str:
    total_analysts = sum(filter(None, [
        analyst_strong_buy, analyst_buy, analyst_hold,
        analyst_sell, analyst_strong_sell
    ]))
    bullish = (analyst_strong_buy or 0) + (analyst_buy or 0)

    analyst_block = ""
    if total_analysts > 0:
        analyst_block = (
            f"- Analyst ratings: {analyst_strong_buy or 0} Strong Buy, "
            f"{analyst_buy or 0} Buy, {analyst_hold or 0} Hold, "
            f"{analyst_sell or 0} Sell, {analyst_strong_sell or 0} Strong Sell "
            f"({bullish}/{total_analysts} bullish)\n"
        )
        if analyst_target_price:
            upside = ((analyst_target_price - current_price) / current_price) * 100
            analyst_block += f"- Consensus price target: ${analyst_target_price:.2f} ({upside:+.1f}% from current)\n"

    ma_block = ""
    if moving_avg_50 and moving_avg_200:
        above_50  = "above" if current_price > moving_avg_50  else "below"
        above_200 = "above" if current_price > moving_avg_200 else "below"
        ma_block  = (
            f"- 50-day MA: ${moving_avg_50:.2f} (trading {above_50})\n"
            f"- 200-day MA: ${moving_avg_200:.2f} (trading {above_200})\n"
        )

    change_block = ""
    if price_change_pct is not None:
        change_block = f"- Day change: {price_change_pct:+.2f}%\n"

    headlines_block = ""
    if top_headlines:
        formatted = "\n".join(f"  • {h}" for h in top_headlines[:5])
        headlines_block = f"\nTop news headlines driving coverage:\n{formatted}\n"

    return f"""You are a financial writer for a daily stock spotlight website. Write a concise, engaging 2–3 sentence summary explaining why {company_name} ({ticker}) is today's featured stock.

Data available:
- Ticker: {ticker}
- Company: {company_name}
- Sector: {sector} / {industry}
- Current price: ${current_price:.2f}
{change_block}- News mentions today: {mention_count} articles across major finance outlets
{analyst_block}{ma_block}{headlines_block}
Guidelines:
- Write in a confident, neutral financial journalism tone (like a Bloomberg brief)
- Lead with the most compelling reason it's in the spotlight today
- Weave in 1–2 data points naturally (analyst consensus, price target upside, or technical position)
- Do NOT use filler phrases like "As of today" or "It's worth noting"
- Do NOT use bullet points or headers — flowing prose only
- Keep it to 2–3 sentences maximum
- Do not start with the company name or ticker"""


# ---------------------------------------------------------------------------
# Template fallback (used when Gemini is unavailable)
# ---------------------------------------------------------------------------

def _template_write_up(
    ticker: str,
    company_name: str,
    sector: str,
    industry: str,
    mention_count: int,
    current_price: float,
    analyst_target_price: Optional[float],
    analyst_strong_buy: Optional[int],
    analyst_buy: Optional[int],
    analyst_hold: Optional[int],
    analyst_sell: Optional[int],
    analyst_strong_sell: Optional[int],
    moving_avg_50: Optional[float],
    moving_avg_200: Optional[float],
    price_change_pct: Optional[float],
    **_,
) -> str:
    parts: List[str] = []

    coverage = "dominated" if mention_count >= 30 else ("led" if mention_count >= 15 else "appeared across")
    parts.append(
        f"{company_name} ({ticker}) {coverage} finance headlines today, "
        f"surfacing in {mention_count} articles across major news outlets."
    )

    total = sum(filter(None, [analyst_strong_buy, analyst_buy, analyst_hold, analyst_sell, analyst_strong_sell]))
    if total > 0:
        bullish = (analyst_strong_buy or 0) + (analyst_buy or 0)
        pct = bullish / total
        label = "broadly bullish" if pct >= 0.70 else ("cautiously optimistic" if pct >= 0.55 else "mixed")
        sentence = f"Wall Street is {label}, with {bullish} of {total} analysts rating it a Buy or Strong Buy"
        if analyst_target_price and current_price > 0:
            upside = ((analyst_target_price - current_price) / current_price) * 100
            direction = "upside" if upside >= 0 else "downside"
            sentence += f", and the consensus target of ${analyst_target_price:.2f} implies {abs(upside):.1f}% {direction}."
        else:
            sentence += "."
        parts.append(sentence)

    if moving_avg_50 and moving_avg_200 and current_price > 0:
        if current_price > moving_avg_50 and current_price > moving_avg_200:
            parts.append(
                f"Shares are trading above both the 50-day (${moving_avg_50:.2f}) and "
                f"200-day (${moving_avg_200:.2f}) moving averages, a technically constructive setup."
            )

    parts.append(
        f"{company_name} operates in {industry} within the {sector} sector."
    )
    return " ".join(parts)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

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
    kwargs = dict(
        ticker=ticker, company_name=company_name, sector=sector, industry=industry,
        mention_count=mention_count, current_price=current_price,
        analyst_target_price=analyst_target_price,
        analyst_strong_buy=analyst_strong_buy, analyst_buy=analyst_buy,
        analyst_hold=analyst_hold, analyst_sell=analyst_sell,
        analyst_strong_sell=analyst_strong_sell,
        moving_avg_50=moving_avg_50, moving_avg_200=moving_avg_200,
        price_change_pct=price_change_pct, top_headlines=top_headlines,
    )

    # Try Gemini first; fall back to template if anything goes wrong
    prompt = _build_prompt(**kwargs)
    ai_text = _gemini_write_up(prompt)
    if ai_text:
        return ai_text

    return _template_write_up(**kwargs)
