---
"sacred-sutra-tools": patch
---

Optimize inventory updates with batch API calls for returns processing

- Add `adjustInventoryBatch` method to InventoryService for processing multiple inventory adjustments in a single transaction
- Refactor ReturnsInventoryIntegration service to collect all adjustments and make one batch call instead of individual API calls per return item
- Maintain full audit trail and comprehensive error handling for batch operations
- Reduce API calls significantly when processing multiple return items, improving performance and reducing database load
