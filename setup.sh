#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  YogaFlow — Quick Setup Script
#  Run: chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}🧘  YogaFlow Setup${NC}"
echo "──────────────────────────────────────"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌  Node.js is not installed.${NC}"
  echo "Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌  Node.js 18+ required. You have $(node -v).${NC}"
  exit 1
fi

echo -e "${GREEN}✅  Node.js $(node -v) detected${NC}"

# Install dependencies
echo ""
echo -e "${CYAN}📦  Installing dependencies...${NC}"
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
echo -e "${GREEN}✅  All dependencies installed${NC}"

# Create .env from example
echo ""
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}⚙️   Created backend/.env from .env.example${NC}"
  echo -e "${YELLOW}    → Please edit backend/.env with your actual values${NC}"
else
  echo -e "${GREEN}✅  backend/.env already exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
  echo -e "${YELLOW}⚙️   Created frontend/.env from .env.example${NC}"
else
  echo -e "${GREEN}✅  frontend/.env already exists${NC}"
fi

# Summary
echo ""
echo "──────────────────────────────────────"
echo -e "${GREEN}🎉  Setup complete!${NC}"
echo ""
echo -e "Next steps:"
echo -e "  ${CYAN}1.${NC} Edit ${YELLOW}backend/.env${NC} with your MongoDB URI + Gmail credentials"
echo -e "  ${CYAN}2.${NC} Run ${YELLOW}npm run dev${NC} to start both servers"
echo -e "  ${CYAN}3.${NC} Open ${YELLOW}http://localhost:5173${NC} in your browser"
echo ""
echo -e "Need help? See ${CYAN}README.md${NC} for detailed instructions."
echo ""
