from dotenv import load_dotenv
load_dotenv()

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stock, archive, scraper
from routers.scraper import run_daily_scrape
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="America/New_York")


async def _scheduled_scrape():
    logger.info("APScheduler: firing daily scrape")
    try:
        result = await run_daily_scrape()
        logger.info("APScheduler: scrape complete — %s", result)
    except Exception as e:
        logger.error("APScheduler: scrape failed — %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        _scheduled_scrape,
        CronTrigger(day_of_week="mon-fri", hour=9, minute=30, timezone="America/New_York"),
    )
    scheduler.start()
    logger.info("APScheduler started — daily scrape fires at 9:30 AM ET (Mon–Fri)")
    yield
    scheduler.shutdown()


app = FastAPI(title="Stock of the Day API", version="1.0.0", lifespan=lifespan)

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "x-scraper-secret"],
)

app.include_router(stock.router, prefix="/api/stock", tags=["stock"])
app.include_router(archive.router, prefix="/api/archive", tags=["archive"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["scraper"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
