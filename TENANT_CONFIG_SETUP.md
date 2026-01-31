# Multi-tenant Firebase Configuration Setup

This document explains how to configure multiple Firebase projects for different tenants (hosts) in your application.

## Overview

The application supports multi-tenant Firebase configurations through build-time injection. Tenant configurations are stored as a GitHub Secret and injected during the build process.

## GitHub Secret Setup

### 1. Create the Configuration JSON

Create a JSON object containing all your tenant configurations:

```json
{
  "client-a.example.com": {
    "apiKey": "AIza...",
    "authDomain": "client-a.firebaseapp.com",
    "projectId": "client-a-project",
    "storageBucket": "client-a.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abc123"
  },
  "client-b.example.com": {
    "apiKey": "AIza...",
    "authDomain": "client-b.firebaseapp.com",
    "projectId": "client-b-project",
    "storageBucket": "client-b.appspot.com",
    "messagingSenderId": "987654321",
    "appId": "1:987654321:web:xyz789"
  }
}
```

**Important:** Minify the JSON (remove all whitespace) before adding it to GitHub Secrets.

### 2. Add to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VITE_TENANT_CONFIGS`
5. Value: Paste your minified JSON
6. Click **Add secret**

### 3. Set Default Host (Optional)

Add another secret for the default host:

1. Name: `VITE_DEFAULT_HOST`
2. Value: `app.example.com` (your main domain)

## Local Development

For local development, you can set `VITE_TENANT_CONFIGS` in your `.env.local` file:

```bash
# .env.local
VITE_TENANT_CONFIGS='{"test.localhost":{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}}'
```

Or simply rely on the existing `VITE_FIREBASE_*` environment variables for the default configuration.

## How It Works

1. **Build Time:** During CI/CD builds, the `VITE_TENANT_CONFIGS` secret is injected as an environment variable
2. **Parse:** The application parses this JSON at module initialization
3. **Runtime:** When the app loads, it checks `window.location.hostname` and selects the matching configuration
4. **Fallback:** 
   - Localhost/dev IPs use the default `VITE_FIREBASE_*` env vars
   - Unknown hosts redirect to `DEFAULT_HOST`

## Adding a New Tenant

1. Get the Firebase configuration for the new tenant project
2. Update your `VITE_TENANT_CONFIGS` JSON with the new entry
3. Update the GitHub Secret with the new JSON
4. Deploy - the next build will include the new tenant

## Security Notes

- ✅ Configs are kept out of source control
- ⚠️ Configs will be visible in the client bundle (this is normal for client-side apps)
- ✅ Only authorized users can modify GitHub Secrets
- ✅ Firebase security rules protect your data, not config visibility
