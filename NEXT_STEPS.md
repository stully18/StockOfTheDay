# SOTD — Next Steps

Last session ended: Gemini AI write-up working, Alpha Vantage integrated, analyst ratings sidebar live.
Both `dev` and `main` are up to date on GitHub (commit `c44b96d`).

---

## Immediate Next: Functionality (do before any frontend design work)

### 1. APScheduler — Automated Daily Scraper
Wire up the scheduler that's already installed (`apscheduler==3.10.4` in requirements).
Add to `backend/main.py` on startup:
- Run `POST /api/scraper/run` logic at **9:30 AM ET (14:30 UTC) on weekdays only**
- Skip weekends and US market holidays
- Log when it fires so Railway logs show it running

File to edit: `backend/main.py`

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler(timezone="America/New_York")

@app.on_event("startup")
async def start_scheduler():
    scheduler.add_job(run_daily_scrape, CronTrigger(day_of_week="mon-fri", hour=9, minute=30))
    scheduler.start()
```

---

### 2. StockTwits Trending — Second Selection Signal
Add `backend/scrapers/stocktwits_client.py`:
- Call `https://api.stocktwits.com/api/2/trending/symbols.json` — **no auth, no API key**
- Returns top 30 trending tickers with message volume
- Merge with RSS mention count using a weighted score:
  - RSS mention: 1 point each
  - StockTwits trending rank 1–10: 15 points, rank 11–20: 10 points, rank 21–30: 5 points
- This prevents a single viral article from dominating

File to create: `backend/scrapers/stocktwits_client.py`
File to edit: `backend/routers/scraper.py` (merge signals before picking top ticker)

---

### 3. 5-Day Cooldown — Prevent Repeats
Same stock shouldn't appear more than once every 5 trading days.
- Check `backend/data/archive/` for the last 5 entries
- If top ticker appears in recent archive, pick the next-ranked ticker instead

File to edit: `backend/routers/scraper.py`

---

### 4. News Headlines on Stock Page
The scraper already collects article headlines — save the top 5 relevant to the featured stock
in `today.json` and display them on the frontend stock page.

Backend:
- In `scraper.py`, filter `all_articles` to those mentioning the top ticker
- Save top 5 as `"headlines": [{"title": "...", "source": "...", "link": "...", "published": "..."}]`

Frontend:
- Add a `NewsHeadlines` component below the Company Overview section
- Show title, source badge, published time, and link-out arrow

---

## Deployment (do after functionality is complete)

### 5. Railway Backend Deployment
- Create new Railway project, connect GitHub repo
- Set root directory to `backend/`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add environment variables in Railway dashboard:
  - `ALPHA_VANTAGE_API_KEY=your_key_here`
  - `GOOGLE_AI_API_KEY=your_key_here`
  - `ALLOWED_ORIGINS=https://your-app.vercel.app`
  - `SCRAPER_SECRET=your_random_secret_here`
- Railway keeps the server alive 24/7, so APScheduler will fire reliably

### 6. Vercel Frontend Deployment
- Connect GitHub repo to Vercel
- Set root directory to `frontend/`
- Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app`
- Vercel auto-deploys on every push to `main`

---

## Nice-to-Have (later, after deployment)

- **Reddit scraping**: Shane needs to get Reddit API credentials (account needs email
  verification + some post history). When ready, flip `REDDIT_ENABLED = True` in
  `backend/scrapers/rss_scraper.py` and add `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` to .env.

- **Archive page enhancements**: Sort by return since featured, filter by sector.

- **Market holiday awareness**: Skip the scheduler on US market holidays (use the
  `trading_calendars` or `pandas_market_calendars` library).

---

## Current Stack Reference

| Layer | Tech | Status |
|---|---|---|
| Frontend | Next.js on Vercel | Local only |
| Backend | FastAPI on Railway | Local only |
| Chart data | Yahoo Finance chart API (no auth) | Working |
| Fundamentals + analyst ratings | Alpha Vantage (key in .env) | Working |
| AI write-up | Google Gemini 2.5 Flash (key in .env) | Working |
| News scraping | RSS (4 feeds) | Working |
| Reddit | PRAW — disabled | Needs API creds |
| Daily automation | APScheduler | Not wired up yet |
| Stock trending signal | StockTwits | Not added yet |

## Start Command
```bash
cd /home/shane/projects/SOTD && ./start.sh
```
