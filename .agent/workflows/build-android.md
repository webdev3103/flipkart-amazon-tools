---
description: Build production Android app for deployment
---

# Build Production Android App

This workflow helps you build production-ready Android apps for Firebase App Distribution or Google Play Store.

## Prerequisites: Firebase Setup

**IMPORTANT**: Before building, ensure Firebase is configured for Android.

### Check if google-services.json exists
```bash
// turbo
ls -la android/app/google-services.json
```

### If missing, set up Firebase Android app
```bash
./scripts/setup-firebase-android.sh
```

This will guide you through:
1. Creating an Android app in Firebase Console
2. Downloading `google-services.json`
3. Placing it in the correct location

**Alternative**: Download manually from [Firebase Console](https://console.firebase.google.com/project/sacred-sutra/settings/general) and place at `android/app/google-services.json`

---

## Quick Build

### Build Both APK and AAB
```bash
// turbo
./scripts/build-android-production.sh
```

### Build APK Only (for Firebase App Distribution)
```bash
// turbo
./scripts/build-android-production.sh --apk-only
```

### Build AAB Only (for Google Play Store)
```bash
// turbo
./scripts/build-android-production.sh --aab-only
```

### Clean Build
```bash
// turbo
./scripts/build-android-production.sh --clean
```

## Manual Build Steps

### 1. Build Web Assets
```bash
// turbo
npm run build:mobile
```

### 2. Sync Capacitor
```bash
// turbo
npx cap sync android
```

### 3. Build APK
```bash
cd android && ./gradlew assembleRelease && cd ..
```

### 4. Build AAB
```bash
cd android && ./gradlew bundleRelease && cd ..
```

## Deploy to Firebase App Distribution

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

### Deploy APK
```bash
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "testers" \
  --release-notes "Production build"
```

### Get Firebase App ID
```bash
// turbo
firebase apps:list
```

## Deploy to Google Play Store

1. Build AAB: `./scripts/build-android-production.sh --aab-only`
2. Go to [Google Play Console](https://play.google.com/console)
3. Select your app
4. Navigate to **Production** → **Create new release**
5. Upload `android/app/build/outputs/bundle/release/app-release.aab`
6. Fill in release notes and submit

## Test Installation

### Install on Connected Device
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Uninstall Previous Version
```bash
adb uninstall com.sacredsutra.tools
```

## Update Version

Before building for production, update the version:

1. Update `package.json` version
2. Update `android/app/build.gradle`:
   - Increment `versionCode` (e.g., 1 → 2)
   - Update `versionName` (e.g., "1.0" → "10.4.1")

## Verify Signing

### Verify APK
```bash
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

### Verify AAB
```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

## Troubleshooting

### Keystore Not Found
```bash
./scripts/generate-android-keystore.sh
```

### Clean Build
```bash
cd android && ./gradlew clean && cd ..
```

### Check Java Version
```bash
java -version
# Should be 17+
```

## Build Outputs

- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## Additional Resources

See the complete guide: [Android Production Build Guide](/.gemini/antigravity/brain/540b82fc-ebc1-4102-b7b2-0f66cd95040b/android-production-build-guide.md)
