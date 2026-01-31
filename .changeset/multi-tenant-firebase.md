---
"sacred-sutra-tools": minor
---

Implement multi-tenant Firebase configuration with build-time injection

- Add dynamic Firebase project selection based on hostname
- Support multiple Firebase projects via `VITE_TENANT_CONFIGS` environment variable
- Inject tenant configurations from GitHub Secrets during CI/CD builds
- Add automatic redirect to default host for unknown domains
- Create comprehensive setup documentation
- Update all CI workflows to support tenant config injection
