#!/bin/bash

# Sacred Sutra Tools - Android Deployment Script
# This script automates the build and deployment process using Fastlane

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Sacred Sutra Tools - Android Deployment${NC}"
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# Parse command line arguments
LANE=${1:-build}

case $LANE in
    build)
        echo -e "${YELLOW}📦 Building release APK and AAB...${NC}"
        ;;
    beta)
        echo -e "${YELLOW}🧪 Deploying to internal testing...${NC}"
        ;;
    production)
        echo -e "${YELLOW}🚀 Deploying to production...${NC}"
        ;;
    promote)
        echo -e "${YELLOW}⬆️  Promoting to production...${NC}"
        LANE="promote_to_production"
        ;;
    *)
        echo -e "${RED}❌ Invalid lane: $LANE${NC}"
        echo "Usage: $0 [build|beta|production|promote]"
        exit 1
        ;;
esac

# Step 1: Build web assets
echo -e "\n${YELLOW}Step 1/4: Building web assets...${NC}"
npm run build:mobile

# Step 2: Sync to Android
echo -e "\n${YELLOW}Step 2/4: Syncing to Android...${NC}"
npx cap sync android

# Step 3: Install Fastlane dependencies
echo -e "\n${YELLOW}Step 3/4: Installing Fastlane dependencies...${NC}"
if [ ! -f "Gemfile.lock" ]; then
    bundle install
fi

# Step 4: Run Fastlane
echo -e "\n${YELLOW}Step 4/4: Running Fastlane lane: $LANE${NC}"
cd android
bundle exec fastlane $LANE
cd ..

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
