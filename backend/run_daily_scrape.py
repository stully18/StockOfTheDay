"""Railway cron entry point — calls the daily scrape pipeline on the main backend."""
import asyncio
import httpx
import os
import sys

BACKEND_URL    = os.getenv("BACKEND_INTERNAL_URL", "http://localhost:8000")
SCRAPER_SECRET = os.getenv("SCRAPER_SECRET", "")


async def main():
    url     = f"{BACKEND_URL}/api/scraper/run"
    headers = {"x-scraper-secret": SCRAPER_SECRET}

    print(f"Triggering daily scrape at {url}")

    async with httpx.AsyncClient(timeout=180) as client:
        resp = await client.post(url, headers=headers)
        resp.raise_for_status()
        print(f"Success: {resp.json()}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Scrape failed: {e}", file=sys.stderr)
        sys.exit(1)
