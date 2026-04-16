from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stock, archive, scraper

app = FastAPI(title="Stock of the Day API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock.router, prefix="/api/stock", tags=["stock"])
app.include_router(archive.router, prefix="/api/archive", tags=["archive"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["scraper"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
