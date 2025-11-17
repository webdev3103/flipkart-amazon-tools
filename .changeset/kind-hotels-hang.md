---
"sacred-sutra-tools": minor
---

feat(dashboard): Complete dashboard redesign with workflow-focused widgets

- Add 5 new analytics widgets: Profit Summary, Recent PDF Uploads, Inventory Alerts Summary, Top Categories by Revenue, and Expense Breakdown
- Remove outdated widgets: high-priced products, all products categorized, inventory overview
- Implement responsive mobile layouts with optimized item counts
- Update Firebase Storage rules to add `list` permissions for PDF directory operations
- Add graceful error handling and loading states for all widgets
- Support pull-to-refresh on mobile dashboard
