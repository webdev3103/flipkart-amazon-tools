#!/bin/bash
set -e

# Firebase Android App Setup Script
# Creates Android app in Firebase and downloads google-services.json

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔥 Firebase Android App Setup${NC}"
echo "=============================="
echo ""

# Configuration
FIREBASE_PROJECT="sacred-sutra"
ANDROID_PACKAGE="com.sacredsutra.tools"
APP_DISPLAY_NAME="Sacred Sutra Tools"
OUTPUT_FILE="android/app/google-services.json"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Firebase Project: $FIREBASE_PROJECT"
echo "   Package Name: $ANDROID_PACKAGE"
echo "   App Name: $APP_DISPLAY_NAME"
echo "   Output: $OUTPUT_FILE"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Error: Firebase CLI not found${NC}"
    echo "   Install: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found${NC}"
echo ""

# Check if user is logged in
echo -e "${BLUE}🔐 Checking Firebase authentication...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "   Running: firebase login"
    firebase login
fi

echo -e "${GREEN}✅ Authenticated${NC}"
echo ""

# List existing apps
echo -e "${BLUE}📱 Checking existing Firebase apps...${NC}"
firebase apps:list --project $FIREBASE_PROJECT

echo ""
echo -e "${YELLOW}❓ Do you want to create a new Android app in Firebase?${NC}"
echo "   This will register the Android app and download google-services.json"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    echo ""
    echo -e "${BLUE}📝 Manual Steps:${NC}"
    echo "1. Go to https://console.firebase.google.com/"
    echo "2. Select project: $FIREBASE_PROJECT"
    echo "3. Click 'Add app' → Android"
    echo "4. Package name: $ANDROID_PACKAGE"
    echo "5. Download google-services.json"
    echo "6. Place at: $OUTPUT_FILE"
    exit 0
fi

# Create Android app using Firebase CLI
echo ""
echo -e "${BLUE}🚀 Creating Android app in Firebase...${NC}"

# Note: Firebase CLI doesn't have a direct command to create apps
# We'll use the Firebase Management API or guide user to console

echo -e "${YELLOW}⚠️  Firebase CLI doesn't support creating apps directly${NC}"
echo ""
echo -e "${BLUE}📝 Please follow these steps:${NC}"
echo ""
echo "1. Open Firebase Console:"
echo -e "   ${GREEN}https://console.firebase.google.com/project/$FIREBASE_PROJECT/overview${NC}"
echo ""
echo "2. Click the Android icon or 'Add app' button"
echo ""
echo "3. Enter the following details:"
echo "   • Android package name: ${GREEN}$ANDROID_PACKAGE${NC}"
echo "   • App nickname: ${GREEN}$APP_DISPLAY_NAME${NC}"
echo "   • Debug signing certificate SHA-1: (Optional - skip for now)"
echo ""
echo "4. Click 'Register app'"
echo ""
echo "5. Download the ${GREEN}google-services.json${NC} file"
echo ""
echo "6. Move the file to your project:"
echo -e "   ${GREEN}mv ~/Downloads/google-services.json $OUTPUT_FILE${NC}"
echo ""

# Offer to open Firebase Console
echo -e "${YELLOW}❓ Open Firebase Console in browser?${NC}"
read -p "(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    CONSOLE_URL="https://console.firebase.google.com/project/$FIREBASE_PROJECT/settings/general"
    
    if command -v open &> /dev/null; then
        # macOS
        open "$CONSOLE_URL"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$CONSOLE_URL"
    else
        echo "Please open: $CONSOLE_URL"
    fi
    
    echo -e "${GREEN}✅ Opened Firebase Console${NC}"
fi

echo ""
echo -e "${BLUE}⏳ Waiting for you to download google-services.json...${NC}"
echo "   Press Enter when you've downloaded the file and are ready to continue"
read

# Check if file was downloaded to Downloads folder
if [ -f "$HOME/Downloads/google-services.json" ]; then
    echo -e "${GREEN}✅ Found google-services.json in Downloads${NC}"
    echo ""
    echo -e "${BLUE}📦 Moving file to project...${NC}"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    # Move file
    mv "$HOME/Downloads/google-services.json" "$OUTPUT_FILE"
    
    echo -e "${GREEN}✅ File moved to: $OUTPUT_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  File not found in Downloads folder${NC}"
    echo ""
    echo "Please manually move the file:"
    echo -e "   ${GREEN}mv /path/to/google-services.json $OUTPUT_FILE${NC}"
    echo ""
    read -p "Press Enter when done..."
fi

# Verify file exists
if [ -f "$OUTPUT_FILE" ]; then
    echo ""
    echo -e "${BLUE}🔍 Verifying google-services.json...${NC}"
    
    # Check if it's valid JSON
    if python3 -m json.tool "$OUTPUT_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Valid JSON format${NC}"
        
        # Extract and verify project ID
        PROJECT_ID=$(grep -o '"project_id": "[^"]*"' "$OUTPUT_FILE" | cut -d'"' -f4)
        if [ "$PROJECT_ID" = "$FIREBASE_PROJECT" ]; then
            echo -e "${GREEN}✅ Project ID matches: $PROJECT_ID${NC}"
        else
            echo -e "${YELLOW}⚠️  Project ID mismatch: $PROJECT_ID (expected: $FIREBASE_PROJECT)${NC}"
        fi
        
        # Extract package name
        PACKAGE_NAME=$(grep -o '"package_name": "[^"]*"' "$OUTPUT_FILE" | cut -d'"' -f4)
        if [ "$PACKAGE_NAME" = "$ANDROID_PACKAGE" ]; then
            echo -e "${GREEN}✅ Package name matches: $PACKAGE_NAME${NC}"
        else
            echo -e "${YELLOW}⚠️  Package name mismatch: $PACKAGE_NAME (expected: $ANDROID_PACKAGE)${NC}"
        fi
        
    else
        echo -e "${RED}❌ Invalid JSON format${NC}"
        echo "   Please re-download from Firebase Console"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✅ Firebase Setup Complete!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo ""
    echo "1. (Optional) Add SHA-1 fingerprint to Firebase Console:"
    echo "   Get SHA-1:"
    echo -e "   ${GREEN}keytool -list -v -keystore android/app/release-key.keystore -alias sacredsutra${NC}"
    echo ""
    echo "   Add to Firebase Console:"
    echo "   Project Settings → Your apps → Android app → Add fingerprint"
    echo ""
    echo "2. Build your Android app:"
    echo -e "   ${GREEN}./scripts/build-android-production.sh${NC}"
    echo ""
    echo "3. Test Firebase integration:"
    echo -e "   ${GREEN}adb install android/app/build/outputs/apk/release/app-release.apk${NC}"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ google-services.json not found at: $OUTPUT_FILE${NC}"
    echo ""
    echo "Please download from Firebase Console and place at:"
    echo -e "   ${GREEN}$OUTPUT_FILE${NC}"
fi

echo ""
echo -e "${GREEN}✨ Setup script completed!${NC}"
