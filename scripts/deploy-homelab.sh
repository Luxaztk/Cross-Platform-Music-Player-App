#!/usr/bin/env bash

# ==============================================================================
# MeloVista Homelab Deployment Script for luxaztk-server (Ubuntu 26.04 LTS)
# Manages: melovista-stream-server (Port 4545) & melovista-discord-bot
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}🚀 MeloVista Homelab Deployment on luxaztk-server${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    sudo npm install -g pm2
fi

# 2. Check Node.js
NODE_VER=$(node -v)
echo -e "${GREEN}✓ Node.js version:${NC} ${NODE_VER}"

# 3. Check apps/server/.env
if [ ! -f "apps/server/.env" ]; then
    echo -e "${YELLOW}⚠️  apps/server/.env not found! Creating from .env.example...${NC}"
    cp apps/server/.env.example apps/server/.env
    echo -e "${GREEN}✓ Created apps/server/.env. Please verify MUSIC_DIR path.${NC}"
fi

# 4. Install Dependencies
echo -e "\n${BLUE}📦 Installing & updating Monorepo dependencies...${NC}"
npm install

# 5. Typecheck validation
echo -e "\n${BLUE}🔍 Running TypeScript validation...${NC}"
npx tsc --noEmit

# 6. Start / Reload with PM2
echo -e "\n${BLUE}⚡ Starting / Reloading services with PM2 Master Ecosystem...${NC}"
pm2 start ecosystem.config.cjs

# 7. Persist PM2
echo -e "\n${BLUE}💾 Saving PM2 process list for system reboot persistence...${NC}"
pm2 save

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}✅ MeloVista Homelab services are LIVE and healthy!${NC}"
echo -e "${GREEN}======================================================${NC}"
pm2 status
