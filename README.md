# Stock of the Day

> A daily finance app that automatically selects the most-talked-about stock from financial news and social media, then serves live price data, an AI-generated write-up, and recent headlines — no signup required.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss) ![Recharts](https://img.shields.io/badge/Recharts-3-22c55e)

---

## Overview

Stock of the Day scrapes four major financial news RSS feeds and the StockTwits trending API every weekday at 9:30 AM ET, applies a multi-signal scoring and quality filter, and selects one stock to feature for the day. Visitors get a full picture — live price chart, analyst ratings, key statistics, a Gemini-generated narrative, and the top relevant headlines — without any account or paywall.

---

## Features

- **Automated daily selection** — APScheduler fires at 9:30 AM ET on weekdays; no manual trigger needed
- **Multi-signal scoring** — RSS mention counts + StockTwits trending rank combined into a weighted score
- **Quality filtering** — market cap ≥ $300M, price ≥ $5, analyst coverage ≥ 5 analysts, 5-day cooldown to prevent repeats
- **AI write-ups** — Google Gemini 2.5 Flash generates a 2–3 sentence narrative; template fallback handles API failures
- **Interactive chart** — 7 selectable time periods (1D, 5D, 1M, 3M, 6M, 1Y, 5Y) powered by Yahoo Finance
- **Analyst ratings** — consensus badge, stacked bar breakdown, and analyst target price
- **News headlines** — top 3 articles most relevant to the featured stock, scored by keyword relevance
- **Searchable archive** — full history of every past stock of the day, searchable by ticker or company name
- **Mobile-first UI** — responsive dark theme down to 375px (iPhone SE)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts, Framer Motion |
| Backend | Python, FastAPI, Uvicorn, APScheduler |
| Market Data | yfinance (Yahoo Finance, no auth) |
| Fundamentals & Ratings | Alpha Vantage API |
| AI Write-ups | Google Gemini 2.5 Flash |
| News Scraping | RSS feeds — Yahoo Finance, CNBC, MarketWatch, Seeking Alpha |
| Trending Signal | StockTwits public API (no auth required) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Alpha Vantage API key](https://www.alphavantage.co/support/#api-key) (free tier: 25 req/day)
- [Google AI API key](https://aistudio.google.com/app/settings/api-keys) (free tier: 1,500 req/day)

### Quick Start

```bash
git clone https://github.com/stully18/StockOfTheDay.git
cd StockOfTheDay
./start.sh
```

`start.sh` creates the Python virtual environment, installs all dependencies, seeds `.env` files from the provided examples, and launches both servers in parallel.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

### Environment Variables

**Backend** — create `backend/.env`:
```env
ALPHA_VANTAGE_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:3000
SCRAPER_SECRET=any_random_string
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project Structure

```
StockOfTheDay/
├── backend/
│   ├── main.py               # FastAPI app + APScheduler setup
│   ├── requirements.txt
│   ├── data/
│   │   ├── today.json        # Current featured stock
│   │   └── archive/          # Past stocks, one JSON file per date
│   ├── models/
│   │   └── stock.py          # Pydantic data models
│   ├── routers/
│   │   ├── scraper.py        # Full daily pipeline (scoring, filtering, archiving)
│   │   ├── stock.py          # /today, /chart, /info endpoints
│   │   └── archive.py        # Archive search endpoint
│   └── scrapers/
│       ├── rss_scraper.py    # RSS parsing + ticker extraction
│       ├── stocktwits_client.py
│       ├── yfinance_client.py
│       ├── alphavantage_client.py
│       └── write_up.py       # Gemini AI + template fallback
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Home page (daily stock view)
│   │   └── archive/page.tsx  # Searchable archive grid
│   ├── components/           # StockChart, AnalystRatings, NewsHeadlines, etc.
│   ├── lib/api.ts            # Fetch wrappers for backend endpoints
│   └── types/stock.ts        # TypeScript interfaces
└── start.sh                  # One-command local setup
```

---

## API Reference

### Stock

```
GET  /api/stock/today
GET  /api/stock/{ticker}/chart?period={1d|5d|1mo|3mo|6mo|1y|5y}
GET  /api/stock/{ticker}/info
```

### Archive

```
GET  /api/archive?search={query}
```

### Scraper

```
POST /api/scraper/run
     Header: x-scraper-secret: <SCRAPER_SECRET>
```

### Health

```
GET  /api/health
```

---

## Deployment

**Backend — Railway**

1. Create a new Railway project and connect the GitHub repo
2. Set the root directory to `backend/`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in the Railway dashboard (`ALPHA_VANTAGE_API_KEY`, `GOOGLE_AI_API_KEY`, `ALLOWED_ORIGINS`, `SCRAPER_SECRET`)

**Frontend — Vercel**

1. Connect the GitHub repo to Vercel
2. Set the root directory to `frontend/`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app`
4. Vercel auto-deploys on every push to `main`
