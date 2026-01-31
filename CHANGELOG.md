# Changelog

## 10.5.0

### Minor Changes

- [#110](https://github.com/webdev3103/flipkart-amazon-tools/pull/110) [`da2bd07`](https://github.com/webdev3103/flipkart-amazon-tools/commit/da2bd073be86a5be90000ee822fccb6021dfe3bb) Thanks [@webdev3103](https://github.com/webdev3103)! - Implement multi-tenant Firebase configuration with build-time injection

  - Add dynamic Firebase project selection based on hostname
  - Support multiple Firebase projects via `VITE_TENANT_CONFIGS` environment variable
  - Inject tenant configurations from GitHub Secrets during CI/CD builds
  - Add automatic redirect to default host for unknown domains
  - Create comprehensive setup documentation
  - Update all CI workflows to support tenant config injection

## 10.4.4

### Patch Changes

- [#108](https://github.com/webdev3103/flipkart-amazon-tools/pull/108) [`b77c0e7`](https://github.com/webdev3103/flipkart-amazon-tools/commit/b77c0e75f335dc56a39e4069c74eb0a5865ee550) Thanks [@webdev3103](https://github.com/webdev3103)! - Enable Android/iOS build checks on Pull Requests.

## 10.4.3

### Patch Changes

- [#106](https://github.com/webdev3103/flipkart-amazon-tools/pull/106) [`b45868f`](https://github.com/webdev3103/flipkart-amazon-tools/commit/b45868f616332d1ebc839edfa9499ae59eae617e) Thanks [@webdev3103](https://github.com/webdev3103)! - Add Android build and deployment pipeline with Fastlane, build scripts, and Play Store metadata configuration.

- [#106](https://github.com/webdev3103/flipkart-amazon-tools/pull/106) [`b45868f`](https://github.com/webdev3103/flipkart-amazon-tools/commit/b45868f616332d1ebc839edfa9499ae59eae617e) Thanks [@webdev3103](https://github.com/webdev3103)! - Optimize inventory updates with batch API calls for returns processing

  - Add `adjustInventoryBatch` method to InventoryService for processing multiple inventory adjustments in a single transaction
  - Refactor ReturnsInventoryIntegration service to collect all adjustments and make one batch call instead of individual API calls per return item
  - Maintain full audit trail and comprehensive error handling for batch operations
  - Reduce API calls significantly when processing multiple return items, improving performance and reducing database load

## 10.4.2

### Patch Changes

- [#104](https://github.com/webdev3103/flipkart-amazon-tools/pull/104) [`46c9806`](https://github.com/webdev3103/flipkart-amazon-tools/commit/46c98064231634bc016de0e8435fa5f6aac41b1f) Thanks [@webdev3103](https://github.com/webdev3103)! - Optimize inventory updates with batch API calls for returns processing

  - Add `adjustInventoryBatch` method to InventoryService for processing multiple inventory adjustments in a single transaction
  - Refactor ReturnsInventoryIntegration service to collect all adjustments and make one batch call instead of individual API calls per return item
  - Maintain full audit trail and comprehensive error handling for batch operations
  - Reduce API calls significantly when processing multiple return items, improving performance and reducing database load

## 10.4.1

### Patch Changes

- [#102](https://github.com/webdev3103/flipkart-amazon-tools/pull/102) [`1815302`](https://github.com/webdev3103/flipkart-amazon-tools/commit/18153020030ac99e8a344ce1941d1aca5988f533) Thanks [@webdev3103](https://github.com/webdev3103)! - Fixed order analytics design

## 10.4.0

### Minor Changes

- [#99](https://github.com/webdev3103/flipkart-amazon-tools/pull/99) [`9fe25a2`](https://github.com/webdev3103/flipkart-amazon-tools/commit/9fe25a2befc54a8c65cab253432517f853a7907c) Thanks [@webdev3103](https://github.com/webdev3103)! - Consolidated order and return metrics into meaningful composite cards on the Order Analytics page.

## 10.3.2

### Patch Changes

- [#97](https://github.com/webdev3103/flipkart-amazon-tools/pull/97) [`81c2afd`](https://github.com/webdev3103/flipkart-amazon-tools/commit/81c2afd6221354eca148425a991950edf783c34b) Thanks [@webdev3103](https://github.com/webdev3103)! - Temporarily disabled mobile builds in release pipeline and updated release workflow to create release after successful deployment.

## 10.3.1

### Patch Changes

- [#95](https://github.com/webdev3103/flipkart-amazon-tools/pull/95) [`cf90732`](https://github.com/webdev3103/flipkart-amazon-tools/commit/cf90732ff3ab5eb7fd1c3467f16faa60f9e911a2) Thanks [@webdev3103](https://github.com/webdev3103)! - Implement full-width layouts across all pages by setting Container maxWidth to false

  Updated 9 pages to use full-width containers for better space utilization:

  - Category Groups page
  - Categories page
  - Storage Management page
  - Products page
  - Uncategorized Products page
  - Transaction Analytics page
  - Home (PDF Merger) page
  - Today's Orders page
  - Order Analytics page

  This change provides a more spacious and modern layout across the application while maintaining mobile responsiveness.

## 10.3.0

### Minor Changes

- [#93](https://github.com/webdev3103/flipkart-amazon-tools/pull/93) [`8ae7af6`](https://github.com/webdev3103/flipkart-amazon-tools/commit/8ae7af65a035b9ad3d5652f326ee26a84722d274) Thanks [@webdev3103](https://github.com/webdev3103)! - Added returns processing for flipkart

## 10.2.0

### Minor Changes

- [#85](https://github.com/webdev3103/flipkart-amazon-tools/pull/85) [`1fa2ab6`](https://github.com/webdev3103/flipkart-amazon-tools/commit/1fa2ab6abfc666485fcaabc1a58708c8acc8f5a6) Thanks [@webdev3103](https://github.com/webdev3103)! - Added mobile views for remaining pages

## 10.1.0

### Minor Changes

- [#83](https://github.com/webdev3103/flipkart-amazon-tools/pull/83) [`48d35be`](https://github.com/webdev3103/flipkart-amazon-tools/commit/48d35be972b765d319d0c984a755e80b76c86443) Thanks [@webdev3103](https://github.com/webdev3103)! - feat(dashboard): Complete dashboard redesign with workflow-focused widgets

  - Add 5 new analytics widgets: Profit Summary, Recent PDF Uploads, Inventory Alerts Summary, Top Categories by Revenue, and Expense Breakdown
  - Remove outdated widgets: high-priced products, all products categorized, inventory overview
  - Implement responsive mobile layouts with optimized item counts
  - Update Firebase Storage rules to add `list` permissions for PDF directory operations
  - Add graceful error handling and loading states for all widgets
  - Support pull-to-refresh on mobile dashboard

## 10.0.0

### Major Changes

- [#80](https://github.com/webdev3103/flipkart-amazon-tools/pull/80) [`7d09976`](https://github.com/webdev3103/flipkart-amazon-tools/commit/7d099769a528b506c9a3886bf292aff025adc5e0) Thanks [@webdev3103](https://github.com/webdev3103)! - Integrated android app build

## 9.11.4

### Patch Changes

- [#78](https://github.com/webdev3103/flipkart-amazon-tools/pull/78) [`4691716`](https://github.com/webdev3103/flipkart-amazon-tools/commit/46917164d6016bebc2ca273d3d8feef06205c576) Thanks [@webdev3103](https://github.com/webdev3103)! - Fixed multiple request in loop

## 9.11.3

### Patch Changes

- [#75](https://github.com/webdev3103/flipkart-amazon-tools/pull/75) [`1f01e46`](https://github.com/webdev3103/flipkart-amazon-tools/commit/1f01e46e8468380e2e4a8865a1749b4bda007272) Thanks [@webdev3103](https://github.com/webdev3103)! - Added domain

## 9.11.2

### Patch Changes

- [#71](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/71) [`f579cc4`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/f579cc4ab61ce75cbeef4bbf78428c561a9473ca) Thanks [@webdev3103](https://github.com/webdev3103)! - Fix debug messages and test issues in product scanner feature

  This patch addresses debug message improvements and resolves test failures in the product scanner functionality.

## 9.11.1

### Patch Changes

- [#69](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/69) [`1686a5a`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/1686a5a088cc650daccd0bd4781e36452ed36161) Thanks [@webdev3103](https://github.com/webdev3103)! - Fix PDF merge categorization by ensuring products and categories are loaded before processing

  This change ensures that both products and categories are fetched from the store before PDF merge operations begin, preventing race conditions that could cause products to not be categorized properly during the merge process.

## 9.11.0

### Minor Changes

- [#66](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/66) [`3b90cf1`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/3b90cf18a854642029c8ee3a82f6fee8e538f4ac) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Enhanced orders page with inventory view tab showing real-time stock levels, minimum thresholds, and visual status indicators for improved inventory management. Includes performance improvements and category management fixes.

## 9.10.0

### Minor Changes

- [#64](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/64) [`ce03fa2`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/ce03fa2d755fae5d1bdbc3eaa53258aa9f8b7550) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Enhanced barcode scanner with automatic camera activation on modal open. Camera now starts immediately when scanner tab is activated, eliminating the need for manual camera button clicks. Includes platform-specific optimizations for both mobile and desktop views with improved timing for dialog rendering.

## 9.9.0

### Minor Changes

- [#62](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/62) [`38c5ec5`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/38c5ec569a2cf8b76624af252580a9e81a9a2a0c) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Remove group assignment and hidden products functionality, update category page

## 9.8.0

### Minor Changes

- [#60](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/60) [`76ed55a`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/76ed55a1796b1b006977e4170fe94ca3f643f94a) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Added multiple category groups feature for enhanced inventory management and category linking functionality. This includes category dropdown updates, incremental category updates, and comprehensive inventory deduction capabilities with category associations.

## 9.7.0

### Minor Changes

- [#58](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/58) [`15b2cf5`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/15b2cf5ae8da864961a7d9d96384c8f2262d247c) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - feat: updated category group dropdown; chore: release packages; Implement comprehensive inventory...

### Patch Changes

- [#58](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/58) [`15b2cf5`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/15b2cf5ae8da864961a7d9d96384c8f2262d247c) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Refactor SimpleCategoryTable to use DataTable component and enhance category display

## 9.6.0

### Minor Changes

- [#56](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/56) [`edea406`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/edea4061533f9d04579b05edde7967619ddde860) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - feat: updated category group dropdown; chore: release packages; Implement comprehensive inventory...

## 9.5.0

### Minor Changes

- [#54](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/54) [`57d0678`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/57d06789633bbddf498abe8c39c0eea63bed55bd) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Implement comprehensive inventory management system with deduction tracking, error handling, and monitoring capabilities

## 9.4.0

### Minor Changes

- [#52](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/52) [`12b6b5b`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/12b6b5b99d649ecb4eeef950a02150ea3764cc51) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Implement CategoryGroup service with CRUD operations and validation

## 9.3.0

### Minor Changes

- [#50](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/50) [`11f3d53`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/11f3d537b57c2566451393804b2c16d1cf000707) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Rename create-pr command file to standard .md extension

## 9.2.0

### Minor Changes

- [#48](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/48) [`5d7d953`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/5d7d95341422d3e8f6e099583a146c56b90f302f) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Rename create-pr command file to standard .md extension

## 9.1.0

### Minor Changes

- [#46](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/46) [`7a47092`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/7a47092cbcc541dd433350b12f09ad4fa0acad4b) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Removed inventory management completely

## 9.0.2

### Patch Changes

- [`b9aecfe`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/b9aecfe5e75bc3afb1eaf2bb69548b62afd80e66) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Validate GitHub release creation with improved workflow condition logic

## 9.0.1

### Patch Changes

- [`f32da3a`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/f32da3a3aa50734bf6e624e2d0dde1f631d36c3d) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Fix release workflow to correctly create GitHub releases when changesets are published

## 9.0.0

### Major Changes

- [#41](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/41) [`11e62e3`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/11e62e3270f3a9ccef4603419d3030ff9d79f668) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Introduced batches for orders management

### Minor Changes

- [#40](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/40) [`992abaf`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/992abaffc9aeed04e369b686702ee5cc81b5203d) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - Facelifted todays order page

### Patch Changes

- [#42](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/42) [`bc12c8a`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/bc12c8a6532605583a65a0835f3a5e2128ad2273) Thanks [@byajbook-dev](https://github.com/byajbook-dev)! - changes in pipeline

## 8.2.2

### Patch Changes

- [#38](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/38) [`6f14722`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/6f14722f272b2c5da6c54ca0eaf9b6fd17f0b517) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Fix Amazon PDF page duplication issue in invoice processing

  Resolved critical issue where Amazon PDF transformation could create duplicate pages in the merged output. The fix includes:

  - Added unique page tracking with Set to prevent processing the same page twice
  - Simplified sorting logic to eliminate race conditions causing duplicates
  - Enhanced validation pipeline to catch and remove any remaining duplicates
  - Improved error handling throughout the transformation process

  This ensures each Amazon invoice page appears exactly once in the final merged PDF, improving reliability for e-commerce order processing.

## 8.2.1

### Patch Changes

- [#35](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/35) [`44e1b07`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/44e1b079967a4ee0f535998d95e0d0a46bb55a63) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Added filters to active orders page

## 8.2.0

### Minor Changes

- [#32](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/32) [`7059232`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/70592327a40258a9c5339fba9b9b83d9f075ab78) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Updated PDf to merged correctly with correct quantity and sorting

### Patch Changes

- [#32](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/32) [`7059232`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/70592327a40258a9c5339fba9b9b83d9f075ab78) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Fixed amazon orders not showing up in active orders

## 8.1.0

### Minor Changes

- [#30](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/30) [`28e685a`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/28e685a0dfc5798c871c6e9dcde2b75aac4788d5) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Updated PDf to merged correctly with correct quantity and sorting

## 8.0.0

### Major Changes

- [#28](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/28) [`86ff9ed`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/86ff9edc1a1563fd05d1e1135e8d5dfc7d651cdf) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Added order analytics page to have historical data

### Patch Changes

- [#28](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/28) [`86ff9ed`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/86ff9edc1a1563fd05d1e1135e8d5dfc7d651cdf) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Updated to use least network calls

## 7.0.0

### Major Changes

- [#26](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/26) [`0b089c1`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/0b089c1f458e9d388866101a00dd15a302e1608e) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Added order analytics page to have historical data

## 6.1.1

### Patch Changes

- [#24](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/24) [`abfbf85`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/abfbf85ed26e886cc8cb924e83daa08861f6d425) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Fixed stotage management not able to show files

## 6.1.0

### Minor Changes

- [#22](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/22) [`5aa96c8`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/5aa96c8a4b0d3eca2df879dc3cd122f3d3b36027) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Updated generated pdf files to be visible to all the users

## 6.0.6

### Patch Changes

- [#20](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/20) [`a2d8a8e`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/a2d8a8e4e8bd30fd1cc376c792fc825f2ba5a528) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Added comprehensive category data export/import functionality with CSV support, real-time validation, batch processing, and automatic UI refresh. Enables complete category backup and migration while preserving all data relationships and providing seamless user experience.

## 6.0.5

### Patch Changes

- [#18](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/18) [`d0e3d2a`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/d0e3d2a6cb52e3cb58b3a726ede03b3d07825df6) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Fix PDF display showing incorrect date when date selection changes

  Resolved issue where the TodaysFilesWidget was hardcoded to show current date files instead of respecting the selected date. PDF files now display consistently with the selected date in the Today's Orders page.

  This fix ensures users see the correct PDF files when they select different dates, eliminating confusion between order data and file display.

## 6.0.4

### Patch Changes

- [#16](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/16) [`85eb1bf`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/85eb1bfbff2fd77ff82cf6c41c054706e3f055d1) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - testing

## 6.0.3

### Patch Changes

- [#13](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/13) [`0bd9389`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/0bd938938cf54d7cc508b22c2a78a3965ab2be6c) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Test deployment

## 6.0.2

### Patch Changes

- [#10](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/10) [`63ddc60`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/63ddc60a27df6902e143947d077b0397cac87185) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Test deployment

## 6.0.1

### Patch Changes

- [`35ff714`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/35ff714322ec2d67bd008032528402ffdc706520) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Test deployment

## 6.0.0

### Major Changes

- [#4](https://github.com/himanshu31shr/flipkart-amazon-tools/pull/4) [`cf3095f`](https://github.com/himanshu31shr/flipkart-amazon-tools/commit/cf3095f2c19a38cf8f21f2a100f2b1b7ede20a20) Thanks [@himanshu31shr](https://github.com/himanshu31shr)! - Integrated infra tools and changeset rules

## [1.0.0] - 2024-06-15

### Added

- Cost price inheritance system for products and categories
- CostPriceResolutionService to handle cost price resolution logic
- Migration script for updating existing data to use the new cost price system
- Production build script that bypasses TypeScript errors
- Comprehensive README with deployment instructions
- Script to serve production build locally for testing

### Fixed

- Fixed seed-emulator.js to properly handle active orders seeding
- Fixed DataTable tests to work with the new MobileDataRow implementation
- Fixed DOM nesting warnings by rewriting MobileDataRow to use Paper/Box instead of TableRow/TableCell
- Fixed ESLint configuration to properly ignore dist directory and generated files
- Fixed unescaped entities in MobileFilters components
- Fixed TypeScript errors in DataTable and MobileDataRow components
- Updated tests to match the new component implementations
- Updated CategoryWithInventory interface to include costPrice field
- Fixed CategoryInventoryService to include costPrice in returned objects
- Updated CategoryList component to handle costPrice correctly
- Fixed ProductTableToolbar to use the new addCategory function signature
- Updated addCategory function in productsSlice.ts to accept a CategoryFormData object

### Changed

- Updated Category interface to make costPrice optional
- Modified build process to create production builds without TypeScript errors
- Updated deployment script to use the production build

### Documentation

- Added README with comprehensive deployment instructions
- Added documentation for the cost price inheritance system
- Created CHANGELOG to track changes

## [0.9.0] - 2024-06-01

### Added

- Transaction analytics repair with cost price inheritance
- CostPriceResolutionService integration with TransactionAnalysisService
- Async price resolution with proper inheritance
- Enhanced UI to display cost price sources
- Fixed Orders tab display by adding analyzedTransactions to TransactionSummary
