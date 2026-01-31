import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  Firestore,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator,
  FirestoreError
} from 'firebase/firestore';
import {
  FirebaseStorage,
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';
import { Capacitor } from '@capacitor/core';

import { getTenantConfig, FirebaseConfig, tenantConfigs } from '../config/firebase-tenants';

let firebaseConfig: FirebaseConfig;

// Determine host and get config
if (process.env.NODE_ENV === 'test') {
  // Mock config for tests
  firebaseConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id',
    measurementId: 'test-measurement-id'
  };
} else {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const tenantConfig = getTenantConfig(host);

  if (!tenantConfig) {
    const errorMsg = `❌ Unknown host: "${host}"<br/>📋 Available tenants: <pre>${JSON.stringify(Object.keys(tenantConfigs || {}), null, 2)}</pre>`;
    console.error(`❌ unknown host: "${host}"`);
    console.error(`📋 Available tenants:`, Object.keys(tenantConfigs || {}));

    if (typeof window !== 'undefined') {
      document.body.innerHTML = `
        <div style="
          padding: 20px;
          margin: 20px;
          border: 2px solid red;
          border-radius: 8px;
          background: #fff0f0;
          font-family: monospace;
          color: #333;
        ">
          <h1 style="color: red;">Configuration Error</h1>
          <p>${errorMsg}</p>
          <p>Please check your <code>VITE_TENANT_CONFIGS</code> in GitHub Secrets.</p>
        </div>
      `;
    }
    throw new Error(`Unknown host: ${host}`);
  }
  firebaseConfig = tenantConfig;
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Check if we're in a test environment
if (process.env.NODE_ENV === 'test') {
  // Mock Firebase for tests
  app = {
    name: '[DEFAULT]',
    options: firebaseConfig
  } as FirebaseApp;
  
  auth = {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  } as unknown as Auth;
  
  db = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      get: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn()
    }))
  } as unknown as Firestore;
  
  storage = {
    ref: jest.fn(),
    refFromURL: jest.fn()
  } as unknown as FirebaseStorage;
} else {
  // Real Firebase initialization for non-test environments
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Initialize Firestore with custom configuration
  db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true // Better for certain network conditions
  });
  
  // Initialize Firebase Storage
  storage = getStorage(app);

  // Determine emulator host based on platform
  // Android emulator needs 10.0.2.2 to reach host machine's localhost
  // iOS simulator and web can use localhost
  const getEmulatorHost = (): string => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('🤖 Android detected: Using 10.0.2.2 for emulator connection');
      return '10.0.2.2';
    }
    return 'localhost';
  };

  const emulatorHost = getEmulatorHost();

  // For mobile development, always connect to emulators
  // For web, use environment variables or DEV mode
  // E2E Test Detection: Playwright sets navigator.webdriver to true
  const isE2ETest = typeof window !== 'undefined' && window.navigator.webdriver === true;

  const shouldConnectToEmulators =
    !isE2ETest && 
    import.meta.env.MODE !== 'mobile' && // Never use emulators in mobile builds
    ( // Disable emulators for E2E tests (Playwright can't access localhost emulators)
      import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ||
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT ||
      import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT ||
      (import.meta.env.DEV && !Capacitor.isNativePlatform()) // Only use emulators in DEV mode for web, not native
    );

  if (shouldConnectToEmulators) {
    try {
      // Connect to Firestore emulator
      const firestorePort = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT
        ? parseInt(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT, 10)
        : 8080; // Default Firestore emulator port

      connectFirestoreEmulator(db, emulatorHost, firestorePort);
      console.log(`✓ Connected to Firestore emulator at ${emulatorHost}:${firestorePort}`);
    } catch (error) {
      console.error('Failed to connect to Firestore emulator:', error);
    }

    try {
      // Connect to Auth emulator
      const authPort = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT
        ? parseInt(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT, 10)
        : 9099; // Default Auth emulator port

      const authUrl = `http://${emulatorHost}:${authPort}`;
      connectAuthEmulator(auth, authUrl, { disableWarnings: true });
      console.log(`✓ Connected to Auth emulator at ${authUrl}`);
    } catch (error) {
      console.error('Failed to connect to Auth emulator:', error);
    }

    try {
      // Connect to Storage emulator
      const storagePort = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT
        ? parseInt(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT, 10)
        : 9199; // Default Storage emulator port

      connectStorageEmulator(storage, emulatorHost, storagePort);
      console.log(`✓ Connected to Storage emulator at ${emulatorHost}:${storagePort}`);
    } catch (error) {
      console.error('Failed to connect to Storage emulator:', error);
    }
  } else {
    console.log('🌐 Production mode: Connecting to live Firebase services');
  }
  
  // Enable offline persistence
  const enablePersistence = async () => {
    try {
      await enableIndexedDbPersistence(db, { 
        forceOwnership: false // Allow multiple tabs to share the same persistence
      });
    } catch (err: unknown) {
      // Add type guard for unknown error type
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const firebaseError = err as FirestoreError;
        if (firebaseError.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
        } else if (firebaseError.code === 'unimplemented') {
          // The current browser does not support all of the features required
        }
      }
    }
  };

  if(process.env.NODE_ENV !== 'development') {
    enablePersistence();
  }
}

export { app, auth, db, storage };
