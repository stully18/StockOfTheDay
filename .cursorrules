# CLAUDE.md — Stock of the Day (SOTD)

## Project Overview

**Stock of the Day** is a finance web app that automatically scrapes popular news outlets each day, determines the most-mentioned stock, and features it with live market data, a company write-up, and recent news coverage.

- **Audience:** Finance-curious users, investors, students
- **Key value prop:** One compelling stock story per day — no noise, no signup required

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React, SSR for SEO) |
| Backend | Python + FastAPI |
| Market Data | `yfinance` Python library |
| News Scraping | Yahoo Finance RSS, CNBC/MarketWatch RSS, Reddit (r/stocks, r/investing) |
| Stock Selection | Most-mentioned ticker across all scraped sources |
| Styling | Tailwind CSS |

---

## Site Features

- **Daily Featured Stock** — auto-selected each day from the most-mentioned ticker in scraped news
- **Stock Page:**
  - Live price + interactive chart (via yfinance)
  - Why it was picked today (AI-generated or templated write-up)
  - Company overview: sector, industry, market cap, P/E, description
  - Recent news headlines
- **No user accounts** — fully read-only for all visitors
- **Archive Page** — full searchable history of every past Stock of the Day with original write-ups

---

## UI / Frontend Rules

- **Always invoke the `frontend-design` skill** when building any UI component, page, or layout.
- Design aesthetic: **Modern & sleek (Robinhood-inspired)** — minimal, generous white space, smooth charts, bold accent colors.
- Use **Tailwind CSS** for all styling.
- **Mobile-first design is required.** All layouts must be fully responsive and optimized for mobile screens. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) starting from mobile breakpoints upward. Every component must be tested at 375px (iPhone SE) and 390px (iPhone 14) widths.

---

## GitHub Repository

- **Repo name:** `stock-of-the-day`
- **Branches:** `main` (production-ready) and `dev` (all active development)
- **All work happens on the `dev` branch only** — never commit directly to `main`
- Do not create additional feature branches unless explicitly asked

---

## Commit Rules

- **Never commit until the user explicitly says to commit.**
- Commit messages must summarize the work and features completed in that session.
- One commit per session/feature summary — no auto or partial commits.
- Do not push to remote unless explicitly told to.
- Do not open pull requests or merge branches unless explicitly told to.
- **Never add Claude as a co-author or contributor in any commit message.** Do not include `Co-Authored-By: Claude` or any Anthropic-related attribution in commits.
