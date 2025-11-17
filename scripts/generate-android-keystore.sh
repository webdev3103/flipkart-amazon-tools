#!/bin/bash
set -e

# Android Keystore Generation Script
# This script helps generate a keystore for signing Android release builds

echo "🔐 Android Keystore Generator"
echo "=============================="
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Keep this keystore file SECURE - never commit to Git"
echo "   2. Store keystore password in a password manager"
echo "   3. Back up the keystore to a secure location"
echo "   4. Losing this keystore means you can't update your app!"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
KEYSTORE_DIR="android/app"
KEYSTORE_NAME="release-key.keystore"
KEY_ALIAS="sacredsutra"
KEY_SIZE=2048
VALIDITY_DAYS=10000  # ~27 years

# Get app details
APP_NAME="Sacred Sutra Tools"
ORGANIZATION="Sacred Sutra"
LOCATION="India"

echo -e "${BLUE}📋 Keystore Configuration:${NC}"
echo "   Keystore Location: $KEYSTORE_DIR/$KEYSTORE_NAME"
echo "   Key Alias: $KEY_ALIAS"
echo "   Key Size: $KEY_SIZE bits"
echo "   Validity: $VALIDITY_DAYS days (~27 years)"
echo ""

# Check if keystore already exists
if [ -f "$KEYSTORE_DIR/$KEYSTORE_NAME" ]; then
    echo -e "${YELLOW}⚠️  Warning: Keystore already exists at $KEYSTORE_DIR/$KEYSTORE_NAME${NC}"
    echo ""
    read -p "Do you want to create a new keystore? This will backup the old one. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi

    # Backup existing keystore
    BACKUP_NAME="${KEYSTORE_NAME}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backing up existing keystore to: $BACKUP_NAME"
    mv "$KEYSTORE_DIR/$KEYSTORE_NAME" "$KEYSTORE_DIR/$BACKUP_NAME"
fi

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo -e "${RED}❌ Error: keytool not found${NC}"
    echo "   keytool is part of the Java JDK"
    echo "   Install Java JDK and try again"
    exit 1
fi

echo -e "${GREEN}✅ Java keytool found${NC}"
keytool -version
echo ""

# Prompt for passwords
echo -e "${BLUE}🔑 Password Setup:${NC}"
echo "   You'll need to enter passwords twice (once for generation, once for confirmation)"
echo ""

read -sp "Enter keystore password (min 6 characters): " KEYSTORE_PASSWORD
echo ""
read -sp "Confirm keystore password: " KEYSTORE_PASSWORD_CONFIRM
echo ""

if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}❌ Passwords don't match!${NC}"
    exit 1
fi

if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
    echo -e "${RED}❌ Password must be at least 6 characters!${NC}"
    exit 1
fi

read -sp "Enter key password (can be same as keystore password): " KEY_PASSWORD
echo ""
read -sp "Confirm key password: " KEY_PASSWORD_CONFIRM
echo ""

if [ "$KEY_PASSWORD" != "$KEY_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}❌ Passwords don't match!${NC}"
    exit 1
fi

# Get additional details
echo ""
echo -e "${BLUE}📝 Certificate Information:${NC}"
read -p "Organization Unit (e.g., Development Team) [Engineering]: " ORG_UNIT
ORG_UNIT=${ORG_UNIT:-Engineering}

read -p "City/Locality [Bangalore]: " CITY
CITY=${CITY:-Bangalore}

read -p "State/Province [Karnataka]: " STATE
STATE=${STATE:-Karnataka}

read -p "Country Code (2 letters) [IN]: " COUNTRY
COUNTRY=${COUNTRY:-IN}

echo ""
echo -e "${YELLOW}⏳ Generating keystore...${NC}"
echo ""

# Create keystore directory if it doesn't exist
mkdir -p "$KEYSTORE_DIR"

# Generate keystore using keytool
keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_DIR/$KEYSTORE_NAME" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize $KEY_SIZE \
    -validity $VALIDITY_DAYS \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$APP_NAME, OU=$ORG_UNIT, O=$ORGANIZATION, L=$CITY, ST=$STATE, C=$COUNTRY"

echo ""
echo -e "${GREEN}✅ Keystore generated successfully!${NC}"
echo ""

# Verify keystore
echo -e "${BLUE}🔍 Verifying keystore...${NC}"
keytool -list -v -keystore "$KEYSTORE_DIR/$KEYSTORE_NAME" -storepass "$KEYSTORE_PASSWORD" | head -20

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Keystore Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Generate .gitignore entry
GITIGNORE_PATH="android/app/.gitignore"
if ! grep -q "$KEYSTORE_NAME" "$GITIGNORE_PATH" 2>/dev/null; then
    echo "# Keystore files - NEVER COMMIT THESE!" >> "$GITIGNORE_PATH"
    echo "*.keystore" >> "$GITIGNORE_PATH"
    echo "*.jks" >> "$GITIGNORE_PATH"
    echo "key.properties" >> "$GITIGNORE_PATH"
    echo -e "${GREEN}✅ Added keystore to .gitignore${NC}"
fi

# Save configuration template
CONFIG_FILE="$KEYSTORE_DIR/keystore-config.txt"
cat > "$CONFIG_FILE" << EOF
# Android Keystore Configuration
# Generated: $(date)
#
# ⚠️  KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

KEYSTORE_FILE=$KEYSTORE_NAME
KEY_ALIAS=$KEY_ALIAS
KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD
KEY_PASSWORD=$KEY_PASSWORD

# For GitHub Secrets (base64 encoded keystore):
# Run this command to get the base64 string:
# base64 -i $KEYSTORE_DIR/$KEYSTORE_NAME | pbcopy
# (This copies it to clipboard on macOS)
#
# Or use:
# base64 -i $KEYSTORE_DIR/$KEYSTORE_NAME > keystore.base64.txt

# GitHub Secrets to create:
# - ANDROID_KEYSTORE_BASE64 (from command above)
# - ANDROID_KEYSTORE_PASSWORD ($KEYSTORE_PASSWORD)
# - ANDROID_KEY_ALIAS ($KEY_ALIAS)
# - ANDROID_KEY_PASSWORD ($KEY_PASSWORD)
EOF

echo ""
echo -e "${BLUE}📄 Configuration saved to: $CONFIG_FILE${NC}"
echo -e "${RED}⚠️  NEVER COMMIT THIS FILE TO GIT!${NC}"
echo ""

# Print next steps
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. 🔒 Secure the keystore:"
echo "   - Back up $KEYSTORE_DIR/$KEYSTORE_NAME to a secure location"
echo "   - Store passwords in a password manager"
echo "   - Share with team via secure channel (NOT Git/email)"
echo ""
echo "2. 📱 Configure Android build:"
echo "   - Run: ./scripts/configure-android-signing.sh"
echo "   - Or manually edit android/app/build.gradle"
echo ""
echo "3. ☁️  Set up GitHub Secrets (for CI/CD):"
echo "   - Generate base64 keystore:"
echo "     base64 -i $KEYSTORE_DIR/$KEYSTORE_NAME | pbcopy"
echo "   - Add secrets to GitHub repository settings"
echo "   - See $CONFIG_FILE for required secrets"
echo ""
echo "4. 🧪 Test signing:"
echo "   - Run: cd android && ./gradlew assembleRelease"
echo "   - Verify APK is signed: apksigner verify --print-certs app-release.apk"
echo ""

# Create base64 encoded version for GitHub
echo -e "${YELLOW}🔐 Creating base64 encoded keystore for GitHub Secrets...${NC}"
BASE64_FILE="$KEYSTORE_DIR/keystore.base64.txt"
base64 -i "$KEYSTORE_DIR/$KEYSTORE_NAME" > "$BASE64_FILE"
echo -e "${GREEN}✅ Base64 keystore saved to: $BASE64_FILE${NC}"
echo ""

echo -e "${YELLOW}⚠️  SECURITY REMINDERS:${NC}"
echo "   1. NEVER commit $KEYSTORE_NAME to Git"
echo "   2. NEVER commit $CONFIG_FILE to Git"
echo "   3. NEVER commit $BASE64_FILE to Git"
echo "   4. Back up all files to a secure location immediately"
echo ""
echo -e "${GREEN}✨ Done! Your Android app can now be signed for release.${NC}"
