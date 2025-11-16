#!/bin/bash
set -e

# Android Signing Configuration Script
# Configures build.gradle to use keystore for release signing

echo "🔧 Android Signing Configuration"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

GRADLE_FILE="android/app/build.gradle"
KEYSTORE_DIR="android/app"
KEYSTORE_NAME="release-key.keystore"

# Check if build.gradle exists
if [ ! -f "$GRADLE_FILE" ]; then
    echo -e "${RED}❌ Error: $GRADLE_FILE not found${NC}"
    exit 1
fi

# Check if keystore exists
if [ ! -f "$KEYSTORE_DIR/$KEYSTORE_NAME" ]; then
    echo -e "${RED}❌ Error: Keystore not found at $KEYSTORE_DIR/$KEYSTORE_NAME${NC}"
    echo "   Run: ./scripts/generate-android-keystore.sh first"
    exit 1
fi

echo -e "${GREEN}✅ Found keystore: $KEYSTORE_DIR/$KEYSTORE_NAME${NC}"
echo ""

# Check if signing config already exists
if grep -q "signingConfigs" "$GRADLE_FILE"; then
    echo -e "${YELLOW}⚠️  Warning: Signing configuration already exists in $GRADLE_FILE${NC}"
    echo ""
    read -p "Do you want to reconfigure? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

# Get keystore details
echo -e "${BLUE}🔑 Keystore Configuration:${NC}"
read -p "Key alias [sacredsutra]: " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-sacredsutra}

read -sp "Keystore password: " KEYSTORE_PASSWORD
echo ""

read -sp "Key password: " KEY_PASSWORD
echo ""
echo ""

# Create key.properties file
KEY_PROPERTIES="android/key.properties"
cat > "$KEY_PROPERTIES" << EOF
# Android signing configuration
# Generated: $(date)
# ⚠️  DO NOT COMMIT THIS FILE TO GIT

storePassword=$KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=$KEYSTORE_NAME
EOF

echo -e "${GREEN}✅ Created $KEY_PROPERTIES${NC}"

# Add to .gitignore
GITIGNORE="android/.gitignore"
if ! grep -q "key.properties" "$GITIGNORE" 2>/dev/null; then
    echo "" >> "$GITIGNORE"
    echo "# Signing configuration - NEVER COMMIT" >> "$GITIGNORE"
    echo "key.properties" >> "$GITIGNORE"
    echo -e "${GREEN}✅ Added key.properties to .gitignore${NC}"
fi

# Backup original build.gradle
cp "$GRADLE_FILE" "${GRADLE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Backed up original build.gradle${NC}"
echo ""

echo -e "${BLUE}📝 Updating build.gradle...${NC}"

# Read the current build.gradle
BUILD_GRADLE_CONTENT=$(cat "$GRADLE_FILE")

# Check if signingConfigs already exists
if echo "$BUILD_GRADLE_CONTENT" | grep -q "signingConfigs"; then
    echo -e "${YELLOW}   Signing config exists, will be updated${NC}"
else
    echo -e "${GREEN}   Adding signing configuration${NC}"
fi

# Create the updated build.gradle with signing configuration
cat > "$GRADLE_FILE" << 'EOF'
plugins {
    id 'com.android.application'
}

// Load keystore configuration
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace 'com.sacredsutra.tools'
    compileSdk 34

    defaultConfig {
        applicationId "com.sacredsutra.tools"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        release {
            // Check if keystore properties are available
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
            // Support CI/CD environment variables
            else if (System.getenv('ANDROID_KEYSTORE_PASSWORD') != null) {
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
                storeFile file(System.getenv('ANDROID_KEYSTORE_FILE') ?: 'release-key.keystore')
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'

            // Use signing config if available
            if (signingConfigs.release.storeFile?.exists()) {
                signingConfig signingConfigs.release
            } else {
                println "Warning: Keystore not configured. APK will be unsigned."
            }
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}

// Apply Capacitor Gradle plugin
apply from: '../../node_modules/@capacitor/android/capacitor.gradle'
EOF

echo -e "${GREEN}✅ Updated build.gradle with signing configuration${NC}"
echo ""

# Verify the configuration
echo -e "${BLUE}🔍 Verifying configuration...${NC}"
if grep -q "signingConfigs" "$GRADLE_FILE" && grep -q "keystoreProperties" "$GRADLE_FILE"; then
    echo -e "${GREEN}✅ Signing configuration added successfully${NC}"
else
    echo -e "${RED}❌ Error: Configuration may be incomplete${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Configuration Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

echo -e "${BLUE}📋 What was configured:${NC}"
echo "   1. Created key.properties with signing credentials"
echo "   2. Updated build.gradle with signingConfigs"
echo "   3. Added both local and CI/CD signing support"
echo "   4. Backed up original build.gradle"
echo ""

echo -e "${BLUE}🧪 Test the configuration:${NC}"
echo "   cd android && ./gradlew assembleRelease"
echo ""

echo -e "${BLUE}☁️  For GitHub Actions CI/CD:${NC}"
echo "   The workflow will use environment variables:"
echo "   - ANDROID_KEYSTORE_PASSWORD"
echo "   - ANDROID_KEY_ALIAS"
echo "   - ANDROID_KEY_PASSWORD"
echo "   - ANDROID_KEYSTORE_FILE"
echo ""

echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
echo "   1. key.properties is in .gitignore - DO NOT COMMIT"
echo "   2. Keep keystore file secure and backed up"
echo "   3. Add GitHub Secrets for CI/CD builds"
echo ""
echo -e "${GREEN}✨ Done! Your app can now be signed for release.${NC}"
