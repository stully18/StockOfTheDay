from fastapi import APIRouter, Query
import json, os, glob

router = APIRouter()
ARCHIVE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "archive")


@router.get("/")
def get_archive(search: str = Query(default="", description="Search by ticker or company name")):
    """Return all past stocks of the day, optionally filtered by search term."""
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    entries = []

    for filepath in sorted(glob.glob(os.path.join(ARCHIVE_DIR, "*.json")), reverse=True):
        with open(filepath) as f:
            entry = json.load(f)
        if search:
            q = search.lower()
            if q not in entry.get("ticker", "").lower() and q not in entry.get("company_name", "").lower():
                continue
        entries.append({
            "ticker": entry.get("ticker"),
            "company_name": entry.get("company_name"),
            "date": entry.get("date"),
            "sector": entry.get("sector"),
            "why_featured": entry.get("why_featured"),
            "current_price": entry.get("current_price"),
        })

    return {"count": len(entries), "results": entries}
