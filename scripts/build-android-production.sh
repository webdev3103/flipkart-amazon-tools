#!/bin/bash
set -e

# Android Production Build Script
# Builds production-ready APK and AAB files for deployment

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Android Production Build Script${NC}"
echo "===================================="
echo ""

# Parse arguments
BUILD_TYPE="both"  # Default: build both APK and AAB
CLEAN_BUILD=false
VERIFY_SIGNING=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --apk-only)
            BUILD_TYPE="apk"
            shift
            ;;
        --aab-only)
            BUILD_TYPE="aab"
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --no-verify)
            VERIFY_SIGNING=false
            shift
            ;;
        --help)
            echo "Usage: ./scripts/build-android-production.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --apk-only    Build only APK (for Firebase App Distribution)"
            echo "  --aab-only    Build only AAB (for Google Play Store)"
            echo "  --clean       Clean build directory before building"
            echo "  --no-verify   Skip signing verification"
            echo "  --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/build-android-production.sh                # Build both APK and AAB"
            echo "  ./scripts/build-android-production.sh --apk-only     # Build only APK"
            echo "  ./scripts/build-android-production.sh --clean        # Clean build"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if keystore exists
if [ ! -f "android/app/release-key.keystore" ]; then
    echo -e "${RED}❌ Error: Keystore not found at android/app/release-key.keystore${NC}"
    echo "   Run: ./scripts/generate-android-keystore.sh"
    exit 1
fi

# Check if key.properties exists
if [ ! -f "android/key.properties" ]; then
    echo -e "${RED}❌ Error: key.properties not found${NC}"
    echo "   Run: ./scripts/configure-android-signing.sh"
    exit 1
fi

# Check Java version
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Error: Java not found${NC}"
    echo "   Install Java JDK 17 or higher"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${YELLOW}⚠️  Warning: Java version $JAVA_VERSION detected. Recommended: 17+${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
    cd android
    ./gradlew clean
    cd ..
    echo -e "${GREEN}✅ Clean completed${NC}"
    echo ""
fi

# Step 1: Build web assets
echo -e "${BLUE}🏗️  Step 1/4: Building web assets for mobile...${NC}"
npm run build:mobile
echo -e "${GREEN}✅ Web build completed${NC}"
echo ""

# Step 2: Sync Capacitor
echo -e "${BLUE}🔄 Step 2/4: Syncing Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}✅ Capacitor sync completed${NC}"
echo ""

# Step 3: Build Android
echo -e "${BLUE}📦 Step 3/4: Building Android release...${NC}"
cd android

# Make gradlew executable
chmod +x gradlew

if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${YELLOW}   Building APK...${NC}"
    ./gradlew assembleRelease
    echo -e "${GREEN}   ✅ APK built successfully${NC}"
fi

if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${YELLOW}   Building AAB...${NC}"
    ./gradlew bundleRelease
    echo -e "${GREEN}   ✅ AAB built successfully${NC}"
fi

cd ..
echo ""

# Step 4: Verify signing
if [ "$VERIFY_SIGNING" = true ]; then
    echo -e "${BLUE}🔐 Step 4/4: Verifying signing...${NC}"
    
    if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
        if command -v apksigner &> /dev/null; then
            echo -e "${YELLOW}   Verifying APK signature...${NC}"
            apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
            echo -e "${GREEN}   ✅ APK signature verified${NC}"
        else
            echo -e "${YELLOW}   ⚠️  apksigner not found, using jarsigner...${NC}"
            jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk | head -20
        fi
    fi
    
    if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
        echo -e "${YELLOW}   Verifying AAB signature...${NC}"
        jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab | head -20
        echo -e "${GREEN}   ✅ AAB signature verified${NC}"
    fi
    echo ""
fi

# Display results
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Build Completed Successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

echo -e "${BLUE}📦 Build Artifacts:${NC}"
echo ""

if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
        echo -e "${GREEN}✅ APK:${NC}"
        echo "   Location: $APK_PATH"
        echo "   Size: $APK_SIZE"
        echo "   Use for: Firebase App Distribution, Direct Installation"
        echo ""
    fi
fi

if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
    if [ -f "$AAB_PATH" ]; then
        AAB_SIZE=$(ls -lh "$AAB_PATH" | awk '{print $5}')
        echo -e "${GREEN}✅ AAB:${NC}"
        echo "   Location: $AAB_PATH"
        echo "   Size: $AAB_SIZE"
        echo "   Use for: Google Play Store"
        echo ""
    fi
fi

# Next steps
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""

if [ "$BUILD_TYPE" = "apk" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${YELLOW}For Firebase App Distribution:${NC}"
    echo "  firebase appdistribution:distribute \\"
    echo "    android/app/build/outputs/apk/release/app-release.apk \\"
    echo "    --app YOUR_FIREBASE_APP_ID \\"
    echo "    --groups \"testers\""
    echo ""
    
    echo -e "${YELLOW}For Direct Installation:${NC}"
    echo "  adb install android/app/build/outputs/apk/release/app-release.apk"
    echo ""
fi

if [ "$BUILD_TYPE" = "aab" ] || [ "$BUILD_TYPE" = "both" ]; then
    echo -e "${YELLOW}For Google Play Store:${NC}"
    echo "  1. Go to https://play.google.com/console"
    echo "  2. Select your app"
    echo "  3. Navigate to Production → Create new release"
    echo "  4. Upload: android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
fi

echo -e "${GREEN}✨ Build process completed!${NC}"
