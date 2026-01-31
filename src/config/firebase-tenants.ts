export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Configurable default host via environment variable
export const DEFAULT_HOST = import.meta.env.VITE_DEFAULT_HOST || 'app.sacredsutra.com';

// Parse tenant configs from environment variable (injected at build time)
const parseTenantConfigs = (): Record<string, FirebaseConfig> => {
  const configJson = import.meta.env.VITE_TENANT_CONFIGS;
  if (configJson) {
    try {
      const parsed = JSON.parse(configJson);
      console.log(`✓ Loaded ${Object.keys(parsed).length} tenant configuration(s)`);
      return parsed;
    } catch (error) {
      console.error('Failed to parse VITE_TENANT_CONFIGS:', error);
      return {};
    }
  }
  // No tenant configs provided - this is normal for local development
  return {};
};

export const tenantConfigs: Record<string, FirebaseConfig> = parseTenantConfigs();

export const getTenantConfig = (hostname: string): FirebaseConfig | null => {
  // 1. Check strict match
  if (tenantConfigs[hostname]) {
    return tenantConfigs[hostname];
  }
  
  // 2. Allow localhost/dev environments to fall back to env vars
  // Also checking for standard local IP ranges if needed, but localhost/127.0.0.1 is usually enough for dev
  const isDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.') || hostname.includes('10.0.2.2');
  
  if (isDev) {
     return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };
  }

  // 3. Unknown host in production -> return null to signal redirect
  return null;
};
