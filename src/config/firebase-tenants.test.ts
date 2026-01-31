
import { getTenantConfig, tenantConfigs } from './firebase-tenants';

describe('getTenantConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set test env vars expected by the fallback
    process.env.VITE_FIREBASE_API_KEY = 'dev-api-key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return dev config for localhost', () => {
    const config = getTenantConfig('localhost');
    expect(config).not.toBeNull();
    expect(config?.apiKey).toBe('dev-api-key');
  });

  it('should return dev config for 127.0.0.1', () => {
    const config = getTenantConfig('127.0.0.1');
    expect(config).not.toBeNull();
    expect(config?.apiKey).toBe('dev-api-key');
  });

  it('should return null for unknown host', () => {
    const config = getTenantConfig('unknown.com');
    expect(config).toBeNull();
  });

  it('should return specific config for known tenant', () => {
    // Temporarily add a tenant for testing
    const testHost = 'test-client.com';
    const testConfig = {
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123',
      appId: '1:123:web:abc'
    };
    tenantConfigs[testHost] = testConfig;

    const config = getTenantConfig(testHost);
    expect(config).toEqual(testConfig);
    
    // Cleanup
    delete tenantConfigs[testHost];
  });
});
