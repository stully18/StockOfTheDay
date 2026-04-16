#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Colors ──────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${CYAN}"
echo "  ███████╗ ██████╗ ████████╗██████╗ "
echo "  ██╔════╝██╔═══██╗╚══██╔══╝██╔══██╗"
echo "  ███████╗██║   ██║   ██║   ██║  ██║"
echo "  ╚════██║██║   ██║   ██║   ██║  ██║"
echo "  ███████║╚██████╔╝   ██║   ██████╔╝"
echo "  ╚══════╝ ╚═════╝    ╚═╝   ╚═════╝ "
echo -e "${RESET}  Stock of the Day — dev server"
echo ""

# ── Python virtual env ──────────────────────────────────────────────────
cd "$ROOT/backend"

if [ ! -d "venv" ]; then
  echo -e "${YELLOW}→ Creating Python virtual environment...${RESET}"
  python3 -m venv venv
fi

echo -e "${YELLOW}→ Activating venv and installing dependencies...${RESET}"
source venv/bin/activate
pip install -r requirements.txt -q

# Copy .env if it doesn't exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}  ⚠  Created backend/.env from .env.example — add your Reddit API keys there.${RESET}"
fi

# ── Frontend .env ────────────────────────────────────────────────────────
cd "$ROOT/frontend"
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo -e "${YELLOW}  ⚠  Created frontend/.env.local from .env.example.${RESET}"
fi

echo ""
echo -e "${GREEN}✓ Dependencies ready${RESET}"
echo ""
echo -e "  ${CYAN}Backend  →${RESET} http://localhost:8000"
echo -e "  ${CYAN}Frontend →${RESET} http://localhost:3000"
echo -e "  ${CYAN}API docs →${RESET} http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# ── Start both servers ───────────────────────────────────────────────────
# Trap Ctrl+C and kill both background processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${RESET}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

cd "$ROOT/backend"
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev -- --port 3000 &
FRONTEND_PID=$!

wait
