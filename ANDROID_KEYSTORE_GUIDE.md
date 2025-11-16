# Android Keystore Setup Guide

**Sacred Sutra Tools - Android Release Signing**

## 📋 Overview

This guide walks you through generating and configuring an Android keystore for signing release builds of Sacred Sutra Tools. A signed APK is required for:
- Publishing to Google Play Store
- Distributing APKs directly to users
- Over-the-air (OTA) updates

## ⚠️ Critical Security Information

### What is a Keystore?

A **keystore** is a binary file containing a cryptographic key pair used to sign your Android app. Think of it as your app's digital identity.

### Why is it Important?

1. **Identity Verification**: Proves updates come from you
2. **One-Time Generation**: You can NEVER change the keystore after first release
3. **Irreplaceable**: Losing it means you cannot update your app on Play Store
4. **Security Critical**: Anyone with the keystore can impersonate your app

### 🔐 Security Rules

**NEVER:**
- ❌ Commit keystore to Git
- ❌ Share via email or public channels
- ❌ Store in cloud without encryption
- ❌ Use weak passwords (<8 characters)

**ALWAYS:**
- ✅ Back up to secure location (offline preferred)
- ✅ Use password manager for credentials
- ✅ Share via secure encrypted channels only
- ✅ Keep multiple backups in different locations

## 🚀 Quick Start

### Option 1: Automated Generation (Recommended)

```bash
# Generate keystore
./scripts/generate-android-keystore.sh

# Configure Android build
./scripts/configure-android-signing.sh

# Test signing
cd android && ./gradlew assembleRelease
```

### Option 2: Manual Generation

Follow the detailed steps below.

## 📖 Detailed Steps

### Step 1: Generate Keystore

#### Using the Script (Recommended):

```bash
cd /Users/himan/Work/Sacred\ Sutra/code/sacred-sutra-tools
./scripts/generate-android-keystore.sh
```

The script will:
1. ✅ Check for existing keystore (and backup if found)
2. ✅ Verify Java keytool is installed
3. ✅ Prompt for secure passwords
4. ✅ Generate keystore with proper settings
5. ✅ Create configuration files
6. ✅ Add to .gitignore
7. ✅ Generate base64 for GitHub Secrets

**You will be prompted for:**
- Keystore password (min 6 chars, recommend 16+)
- Key password (can be same as keystore)
- Organization details (name, location, etc.)

#### Manual Generation:

```bash
keytool -genkeypair \
  -v \
  -keystore android/app/release-key.keystore \
  -alias sacredsutra \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Sacred Sutra Tools, OU=Engineering, O=Sacred Sutra, L=Bangalore, ST=Karnataka, C=IN"
```

**Parameters Explained:**
- `-keystore`: Output file path
- `-alias`: Friendly name for the key (used when signing)
- `-keyalg RSA`: Algorithm (RSA is standard)
- `-keysize 2048`: Key size in bits (2048 or 4096)
- `-validity 10000`: Valid for ~27 years
- `-dname`: Certificate details

### Step 2: Verify Keystore

```bash
keytool -list -v \
  -keystore android/app/release-key.keystore \
  -storepass YOUR_PASSWORD
```

**Expected Output:**
```
Keystore type: PKCS12
Keystore provider: SUN

Your keystore contains 1 entry

Alias name: sacredsutra
Creation date: Oct 15, 2025
Entry type: PrivateKeyEntry
Certificate chain length: 1
Certificate[1]:
Owner: CN=Sacred Sutra Tools, OU=Engineering, O=Sacred Sutra, L=Bangalore, ST=Karnataka, C=IN
Issuer: CN=Sacred Sutra Tools, OU=Engineering, O=Sacred Sutra, L=Bangalore, ST=Karnataka, C=IN
Serial number: 1a2b3c4d
Valid from: Wed Oct 15 10:30:00 IST 2025 until: Sat Feb 01 10:30:00 IST 2053
```

### Step 3: Configure Android Build

#### Using the Script:

```bash
./scripts/configure-android-signing.sh
```

#### Manual Configuration:

1. **Create `android/key.properties`:**

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=sacredsutra
storeFile=release-key.keystore
```

2. **Update `android/app/build.gradle`:**

Add before `android` block:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add inside `android` block:
```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

3. **Add to `.gitignore`:**

```gitignore
# Android signing - NEVER COMMIT
*.keystore
*.jks
key.properties
*.base64.txt
keystore-config.txt
```

### Step 4: Test Local Signing

```bash
# Clean previous builds
cd android
./gradlew clean

# Build signed release APK
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

#### Verify the Signature:

```bash
# Using apksigner (from Android SDK)
apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk

# Expected output should show your certificate details
```

## ☁️ GitHub Actions Configuration

### Step 1: Prepare Keystore for Upload

```bash
# Convert keystore to base64
base64 -i android/app/release-key.keystore > keystore.base64.txt

# Copy to clipboard (macOS)
cat keystore.base64.txt | pbcopy

# Or display to copy manually
cat keystore.base64.txt
```

### Step 2: Add GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `ANDROID_KEYSTORE_BASE64` | (base64 string) | Output from base64 command |
| `ANDROID_KEYSTORE_PASSWORD` | (your password) | Keystore password |
| `ANDROID_KEY_ALIAS` | `sacredsutra` | Key alias name |
| `ANDROID_KEY_PASSWORD` | (your password) | Key password |

### Step 3: Workflow Configuration

The release workflow ([.github/workflows/release.yml](.github/workflows/release.yml)) already includes:

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

## 🧪 Testing

### Test 1: Local Signing

```bash
cd android
./gradlew assembleRelease

# Check if APK is signed
apksigner verify app/build/outputs/apk/release/app-release.apk
```

**Expected:** ✅ Verified successfully

### Test 2: Install on Device

```bash
# Install via ADB
adb install -r app/build/outputs/apk/release/app-release.apk

# Or transfer APK to device and install manually
```

### Test 3: CI/CD Build

1. Push changes to trigger workflow
2. Check GitHub Actions logs
3. Download APK artifact
4. Verify signature:
   ```bash
   apksigner verify --print-certs sacred-sutra-tools-android-v*.apk
   ```

## 📂 File Locations

After setup, you'll have:

```
android/
├── app/
│   ├── release-key.keystore          # 🔐 NEVER COMMIT
│   ├── keystore-config.txt           # 🔐 NEVER COMMIT
│   ├── keystore.base64.txt          # 🔐 NEVER COMMIT
│   ├── build.gradle                  # ✅ Commit (has signing config)
│   └── .gitignore                    # ✅ Commit (excludes secrets)
└── key.properties                    # 🔐 NEVER COMMIT

scripts/
├── generate-android-keystore.sh      # ✅ Commit
└── configure-android-signing.sh      # ✅ Commit
```

## 🔄 Backup Strategy

### Critical Files to Backup:

1. **`release-key.keystore`** - The keystore file itself
2. **`keystore-config.txt`** - Passwords and configuration
3. **Certificate details** - From `keytool -list` output

### Backup Locations (Choose Multiple):

- 🗄️ Encrypted USB drive (offline)
- 🔐 Password manager (1Password, LastPass, etc.)
- 🏢 Company secure vault
- ☁️ Encrypted cloud storage (with strong password)
- 📧 Encrypted email to yourself

### Backup Verification:

Test restoring from backup periodically:
```bash
# Copy backup keystore to test location
cp backup/release-key.keystore test-restore/

# Verify it works
keytool -list -v -keystore test-restore/release-key.keystore
```

## 🚨 Troubleshooting

### Issue: "Keystore was tampered with, or password was incorrect"

**Solution:**
- Verify password is correct
- Check keystore file isn't corrupted
- Ensure using correct keystore file

### Issue: "jarsigner: unable to sign jar: java.util.zip.ZipException: invalid entry compressed size"

**Solution:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Issue: "No signing config specified for variant 'release'"

**Solution:**
- Ensure `key.properties` exists
- Verify paths in `build.gradle`
- Check keystore file location

### Issue: GitHub Actions - "Keystore file not found"

**Solution:**
- Verify `ANDROID_KEYSTORE_BASE64` secret is set
- Check base64 decode command in workflow
- Ensure file path matches in gradle

## 📊 Keystore Information

### Your Keystore Details:

| Property | Value |
|----------|-------|
| **File Name** | `release-key.keystore` |
| **Location** | `android/app/` |
| **Key Alias** | `sacredsutra` |
| **Algorithm** | RSA |
| **Key Size** | 2048 bits |
| **Validity** | ~27 years (10,000 days) |
| **Format** | PKCS12 |

### Certificate Distinguished Name:

```
CN=Sacred Sutra Tools
OU=Engineering
O=Sacred Sutra
L=Bangalore
ST=Karnataka
C=IN
```

## 🎯 Best Practices

### Password Management:

1. **Use Strong Passwords**: Minimum 16 characters with mix of:
   - Uppercase and lowercase letters
   - Numbers
   - Special characters

2. **Password Manager**: Store in dedicated password manager
   - 1Password
   - Bitwarden
   - LastPass

3. **Separate Passwords**: Consider different passwords for:
   - Keystore password
   - Key password
   - GitHub account

### Team Access:

1. **Limit Access**: Only 2-3 team members should have keystore
2. **Secure Sharing**: Use encrypted channels (not email)
3. **Audit Trail**: Document who has access
4. **Rotation Policy**: Consider what happens if someone leaves

### CI/CD Security:

1. **Protected Secrets**: Use GitHub's encrypted secrets
2. **Branch Protection**: Restrict who can trigger release builds
3. **Audit Logs**: Review GitHub Actions logs regularly
4. **Rotation**: Consider rotating secrets annually

## 📚 Additional Resources

### Android Documentation:
- [Sign Your App](https://developer.android.com/studio/publish/app-signing)
- [Configure Build Variants](https://developer.android.com/build/build-variants)

### Tools:
- [Android Studio](https://developer.android.com/studio) - Build and sign APKs
- [keytool](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html) - Keystore management
- [apksigner](https://developer.android.com/tools/apksigner) - APK signing and verification

### Security:
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Android Security Best Practices](https://developer.android.com/topic/security/best-practices)

## 🆘 Support

If you encounter issues:

1. **Check logs**: `./gradlew assembleRelease --debug`
2. **Verify keystore**: `keytool -list -v -keystore your-keystore.keystore`
3. **Test locally first**: Before pushing to CI/CD
4. **Review workflow**: Check GitHub Actions logs

## 📝 Maintenance

### Yearly Review:
- [ ] Verify backups are accessible
- [ ] Test keystore still works
- [ ] Review team access
- [ ] Update documentation
- [ ] Check certificate expiry (should be ~27 years)

### Before Play Store Release:
- [ ] Verify APK is signed with production keystore
- [ ] Test installation on multiple devices
- [ ] Run security scan (e.g., Google Play Console)
- [ ] Document version and keystore used

---

**Generated:** October 15, 2025
**Version:** 1.0
**App:** Sacred Sutra Tools v9.11.3
