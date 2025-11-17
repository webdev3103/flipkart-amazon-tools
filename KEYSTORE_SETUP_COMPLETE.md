# ✅ Android Keystore Setup - COMPLETE

**Date:** October 16, 2025
**App:** Sacred Sutra Tools v9.11.3
**Status:** Ready for Production Signing

---

## 🎉 What Has Been Configured

### 1. Keystore Generated ✅

**Location:** `android/app/release-key.keystore`

**Details:**
- **Alias:** `sacredsutra`
- **Algorithm:** RSA 2048-bit
- **Validity:** Until March 3, 2053 (~27 years)
- **Certificate:**
  - CN=Sacred Sutra Tools
  - OU=Engineering
  - O=Sacred Sutra
  - L=Bangalore, ST=Karnataka, C=IN

**Fingerprints:**
```
SHA1:   44:64:57:91:79:AB:3F:54:52:36:AE:78:C0:B6:36:68:0C:BD:67:A1
SHA256: 1C:33:36:B1:89:08:63:17:2C:4D:AB:E7:29:C5:98:97:BE:8A:C5:D5:D6:FE:7E:8A:54:2E:1C:DF:68:AB:49:29
```

### 2. Build Configuration ✅

**File:** [android/app/build.gradle](android/app/build.gradle)

Added signing configuration with **dual mode support**:
- **Local Development:** Reads from `key.properties`
- **CI/CD (GitHub Actions):** Uses environment variables

**Key Features:**
- Automatic detection of keystore availability
- Graceful fallback to unsigned if keystore missing
- Warning messages for developers
- CI/CD ready without code changes

### 3. Credentials File ✅

**File:** `android/key.properties` (🔐 NOT in Git)

```properties
storePassword=SacredSutra2025SecureKey
keyPassword=SacredSutra2025SecureKey
keyAlias=sacredsutra
storeFile=app/release-key.keystore
```

### 4. Security Configuration ✅

**Files Updated:**
- `android/.gitignore` - Added keystore exclusions
- `android/app/.gitignore` - Added keystore exclusions

**Protected Files:**
```
*.keystore
*.jks
key.properties
*.base64.txt
keystore-config.txt
```

### 5. GitHub Secrets Ready ✅

**Base64 Encoded Keystore:** `android/app/keystore.base64.txt` (🔐 NOT in Git)

**Size:** 3,737 bytes

---

## 🔑 Credentials

### Keystore Password
```
SacredSutra2025SecureKey
```

### Key Password
```
SacredSutra2025SecureKey
```

### Key Alias
```
sacredsutra
```

**⚠️  CRITICAL:** Store these credentials securely:
- Password manager (1Password, Bitwarden, etc.)
- Company secure vault
- Encrypted backup

---

## ☁️ GitHub Secrets Configuration

### Required Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets:

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `ANDROID_KEYSTORE_BASE64` | (base64 string) | `cat android/app/keystore.base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | `SacredSutra2025SecureKey` | From above |
| `ANDROID_KEY_ALIAS` | `sacredsutra` | From above |
| `ANDROID_KEY_PASSWORD` | `SacredSutra2025SecureKey` | From above |

### Copy Base64 Keystore

**macOS:**
```bash
cat android/app/keystore.base64.txt | pbcopy
```

**Linux:**
```bash
cat android/app/keystore.base64.txt | xclip -selection clipboard
```

**Windows:**
```bash
cat android/app/keystore.base64.txt | clip
```

---

## 🧪 Testing

### Local Build (After Java 17 Setup)

```bash
cd android
./gradlew assembleRelease
```

**Output APK:** `android/app/build/outputs/apk/release/app-release.apk`

### Verify Signature

```bash
# Using apksigner
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk

# Expected output should show certificate with SHA1: 44:64:57...
```

### Install on Device

```bash
# Via ADB
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 CI/CD Integration

### Workflow Status

The release workflow ([.github/workflows/release.yml](.github/workflows/release.yml)) is **already configured** to:

1. ✅ Build mobile web assets
2. ✅ Setup Java 17 environment
3. ✅ Setup Android SDK
4. ✅ Decode base64 keystore from secrets
5. ✅ Update version codes
6. ✅ Build signed release APK
7. ✅ Upload to GitHub release

### Workflow Configuration

```yaml
- name: Build Android Release
  env:
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
    KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    # Create keystore from base64
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/release-key.keystore

    # Build signed APK
    cd android
    ./gradlew assembleRelease
```

---

## 📦 Release Assets

After setting up GitHub Secrets, each release will include:

### Web Asset
```
sacred-sutra-tools-web-v{VERSION}.zip
```
- Deployed to: https://tool.sacredsutra.in/

### Android Asset
```
sacred-sutra-tools-android-v{VERSION}.apk
```
- **Signed** with production keystore
- Ready for direct installation
- Ready for Play Store submission (AAB format)

---

## 🔒 Security Checklist

### Completed ✅
- [x] Keystore generated with strong algorithm (RSA 2048)
- [x] Long validity period (27 years)
- [x] Secure password (24 characters)
- [x] Added to .gitignore (all formats)
- [x] Build configuration supports local + CI/CD
- [x] Base64 encoded for GitHub Secrets

### Recommended Actions 🎯

- [ ] **Backup keystore** to 3+ secure locations:
  - Encrypted USB drive (offline)
  - Password manager
  - Company vault
  - Encrypted cloud storage

- [ ] **Add GitHub Secrets** (see instructions above)

- [ ] **Test CI/CD build:**
  - Create a changeset
  - Merge to master
  - Verify GitHub Actions builds signed APK

- [ ] **Document access:**
  - List who has keystore access
  - Create incident response plan for key compromise

- [ ] **Test signed APK:**
  - Install on multiple devices
  - Verify app signature
  - Test update flow

---

## 📚 Related Documentation

- [DEPLOYMENT_PIPELINE_UPDATES.md](DEPLOYMENT_PIPELINE_UPDATES.md) - Complete deployment flow
- [ANDROID_KEYSTORE_GUIDE.md](ANDROID_KEYSTORE_GUIDE.md) - Comprehensive keystore guide
- [scripts/generate-android-keystore.sh](scripts/generate-android-keystore.sh) - Generation script
- [scripts/configure-android-signing.sh](scripts/configure-android-signing.sh) - Configuration script

---

## ⚠️ Important Reminders

### DO NOT COMMIT
These files are now in your local project but **MUST NEVER be committed to Git**:
- `android/app/release-key.keystore`
- `android/key.properties`
- `android/app/keystore.base64.txt`

They are protected by `.gitignore`, but verify before committing:
```bash
git status --ignored | grep -E "keystore|key.properties"
```

### Backup Now
**Right now**, before you forget:
1. Copy `android/app/release-key.keystore` to 3 secure locations
2. Save credentials from this document to password manager
3. Print this document and store in secure location

### Losing This Keystore Means:
- ❌ Cannot update app on Play Store
- ❌ Cannot publish over existing app
- ❌ Must publish as entirely new app (new package name)
- ❌ Lose all users, reviews, and ratings

---

## 🆘 Troubleshooting

### Issue: "Keystore not found" during build

**Solution:**
```bash
# Verify keystore exists
ls -la android/app/release-key.keystore

# Verify key.properties exists
ls -la android/key.properties

# Check file paths in key.properties
cat android/key.properties
```

### Issue: GitHub Actions - "Failed to decode keystore"

**Solution:**
- Verify `ANDROID_KEYSTORE_BASE64` secret is set correctly
- Re-encode keystore:
  ```bash
  base64 -i android/app/release-key.keystore > keystore.base64.txt
  # Copy content to GitHub Secret
  ```

### Issue: "Wrong password" error

**Solution:**
- Verify password exactly matches: `SacredSutra2025SecureKey`
- Check for extra spaces or line breaks
- Test with keytool:
  ```bash
  keytool -list -v -keystore android/app/release-key.keystore
  ```

---

## ✨ Next Steps

### 1. Immediate (Do Now)
- [ ] Backup keystore to secure locations
- [ ] Save credentials to password manager
- [ ] Add GitHub Secrets

### 2. Before First Release
- [ ] Test local signing (after Java 17 setup)
- [ ] Test CI/CD build with secrets
- [ ] Verify APK signature
- [ ] Test installation on device

### 3. For Play Store
- [ ] Create Google Play Console account
- [ ] Upload signed APK/AAB
- [ ] Configure store listing
- [ ] Set up alpha/beta testing

---

## 📞 Support

If you need help:
1. **Review:** [ANDROID_KEYSTORE_GUIDE.md](ANDROID_KEYSTORE_GUIDE.md)
2. **Check logs:** GitHub Actions workflow logs
3. **Test locally:** `cd android && ./gradlew assembleRelease --debug`
4. **Verify keystore:** `keytool -list -v -keystore android/app/release-key.keystore`

---

**Setup Completed By:** Claude Code
**Date:** October 16, 2025
**Version:** 1.0
**Status:** ✅ Production Ready
