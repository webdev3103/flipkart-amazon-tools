/**
 * ReturnsInventoryIntegration Service
 *
 * Handles automatic inventory restoration for resaleable Flipkart returns.
 * This service bridges the returns management system with the inventory system,
 * ensuring that resaleable returned items are automatically added back to inventory.
 *
 * Business Logic:
 * - Only resaleable returns (qcStatus === 'Resaleable') trigger inventory additions
 * - SKU is mapped to Product to find categoryGroupId
 * - Quantity from return is added back to the category group inventory
 * - Creates audit trail with return reference for traceability
 *
 * Requirements Coverage:
 * - Phase 5: Inventory Integration for resaleable returns
 * - Automatic inventory restoration based on QC status
 * - Full audit trail linking returns to inventory movements
 */

import { FlipkartReturn } from '../../types/flipkartReturns.type';
import { ProductService } from '../product.service';
import { CategoryService } from '../category.service';
import { InventoryService } from '../inventory.service';

export interface InventoryRestorationResult {
  success: boolean;
  restored: {
    returnId: string;
    sku: string;
    categoryGroupId: string;
    quantity: number;
    movementId: string;
  }[];
  skipped: {
    returnId: string;
    sku: string;
    reason: string;
  }[];
  errors: {
    returnId: string;
    sku: string;
    error: string;
  }[];
}

export class ReturnsInventoryIntegrationService {
  private readonly productService: ProductService;
  private readonly categoryService: CategoryService;
  private readonly inventoryService: InventoryService;

  constructor() {
    this.productService = new ProductService();
    this.categoryService = new CategoryService();
    this.inventoryService = new InventoryService();
  }

  /**
   * Process resaleable returns and restore inventory
   *
   * Analyzes each return to determine if it should be restored to inventory:
   * - Must have qcStatus === 'Resaleable' OR resaleable === true
   * - Must have valid SKU that maps to a product
   * - Product must have categoryGroupId mapping
   *
   * @param returns - Array of Flipkart returns to process
   * @param userId - User ID for audit trail (who triggered the restoration)
   * @returns InventoryRestorationResult with detailed success/skip/error breakdown
   */
  async restoreInventoryFromReturns(
    returns: FlipkartReturn[],
    userId: string
  ): Promise<InventoryRestorationResult> {
    const result: InventoryRestorationResult = {
      success: true,
      restored: [],
      skipped: [],
      errors: []
    };

    // Filter for resaleable returns only
    const resaleableReturns = returns.filter(r => r.resaleable);

    if (resaleableReturns.length === 0) {
      return result;
    }

    // Fetch all products and categories once for efficient mapping
    const products = await this.productService.getProducts({});
    const productsBySku = new Map(
      products.map(p => [p.sku, p])
    );

    const categories = await this.categoryService.getCategories();
    const categoriesById = new Map(
      categories.map(c => [c.id, c])
    );

    // Process each resaleable return
    for (const returnItem of resaleableReturns) {
      try {
        // Validate SKU mapping
        const product = productsBySku.get(returnItem.sku);

        if (!product) {
          result.skipped.push({
            returnId: returnItem.returnId,
            sku: returnItem.sku,
            reason: 'Product not found in catalog'
          });
          continue;
        }

        // Resolve categoryGroupId: Use product's direct mapping or fetch from category
        let categoryGroupId = product.categoryGroupId;

        if (!categoryGroupId && product.categoryId) {
          const category = categoriesById.get(product.categoryId);
          categoryGroupId = category?.categoryGroupId;
        }

        if (!categoryGroupId) {
          result.skipped.push({
            returnId: returnItem.returnId,
            sku: returnItem.sku,
            reason: 'Product has no category group mapping'
          });
          continue;
        }

        // Use adjustInventoryManually for additions with proper audit trail
        const adjustmentResult = await this.inventoryService.adjustInventoryManually({
          categoryGroupId: categoryGroupId,
          adjustmentType: 'increase',
          quantity: returnItem.quantity,
          reason: 'stock_returned', // Predefined reason code
          notes: `Automatic restoration from return ${returnItem.returnId} - QC Status: ${returnItem.qcStatus || 'Resaleable'}`,
          adjustedBy: userId
        });

        result.restored.push({
          returnId: returnItem.returnId,
          sku: returnItem.sku,
          categoryGroupId: categoryGroupId,
          quantity: returnItem.quantity,
          movementId: adjustmentResult.movementId
        });

      } catch (error) {
        result.success = false;
        result.errors.push({
          returnId: returnItem.returnId,
          sku: returnItem.sku,
          error: error instanceof Error ? error.message : 'Unknown error during inventory restoration'
        });
      }
    }

    return result;
  }

  /**
   * Restore inventory for a single return
   *
   * Convenience method for processing individual returns (e.g., when QC status is updated).
   *
   * @param returnItem - Single Flipkart return to process
   * @param userId - User ID for audit trail
   * @returns InventoryRestorationResult for the single item
   */
  async restoreSingleReturn(
    returnItem: FlipkartReturn,
    userId: string
  ): Promise<InventoryRestorationResult> {
    return this.restoreInventoryFromReturns([returnItem], userId);
  }

  /**
   * Restore inventory for delivered returns (regardless of resaleable status)
   *
   * Business Logic:
   * - Triggers when return has returnDeliveredDate set (return completed/received at warehouse)
   * - Restores inventory unconditionally when return is physically back
   * - Different from resaleable-based restoration which is QC-status dependent
   * - Creates audit trail with "return_delivered" reason code
   *
   * Use Case: When Flipkart returns are physically delivered back to seller's warehouse,
   * the quantity should be restored to inventory immediately, separate from QC assessment.
   *
   * Note: This processes ALL returns with returnDeliveredDate, including both new and updated returns.
   * The inventory service creates an audit trail to track all restoration operations.
   *
   * @param returns - Array of Flipkart returns to process (new or updated)
   * @param userId - User ID for audit trail (who triggered the restoration)
   * @returns InventoryRestorationResult with detailed success/skip/error breakdown
   */
  async restoreInventoryFromDeliveredReturns(
    returns: FlipkartReturn[],
    userId: string
  ): Promise<InventoryRestorationResult> {
    const result: InventoryRestorationResult = {
      success: true,
      restored: [],
      skipped: [],
      errors: []
    };

    // Filter for returns with returnDeliveredDate set (physically received at warehouse)
    const deliveredReturns = returns.filter(r => r.dates.returnDeliveredDate);

    if (deliveredReturns.length === 0) {
      return result;
    }

    // Fetch all products and categories once for efficient mapping
    const products = await this.productService.getProducts({});
    const productsBySku = new Map(
      products.map(p => [p.sku, p])
    );

    const categories = await this.categoryService.getCategories();
    const categoriesById = new Map(
      categories.map(c => [c.id, c])
    );

    // Process each delivered return
    for (const returnItem of deliveredReturns) {
      try {
        // Validate SKU mapping
        const product = productsBySku.get(returnItem.sku);

        if (!product) {
          result.skipped.push({
            returnId: returnItem.returnId,
            sku: returnItem.sku,
            reason: 'Product not found in catalog'
          });
          continue;
        }

        // Resolve categoryGroupId: Use product's direct mapping or fetch from category
        let categoryGroupId = product.categoryGroupId;

        if (!categoryGroupId && product.categoryId) {
          const category = categoriesById.get(product.categoryId);
          categoryGroupId = category?.categoryGroupId;
        }

        if (!categoryGroupId) {
          result.skipped.push({
            returnId: returnItem.returnId,
            sku: returnItem.sku,
            reason: 'Product has no category group mapping'
          });
          continue;
        }

        // Use adjustInventoryManually for additions with proper audit trail
        const adjustmentResult = await this.inventoryService.adjustInventoryManually({
          categoryGroupId: categoryGroupId,
          adjustmentType: 'increase',
          quantity: returnItem.quantity,
          reason: 'stock_returned', // Predefined reason code
          notes: `Automatic restoration from delivered return ${returnItem.returnId} - Delivered: ${returnItem.dates.returnDeliveredDate?.toISOString()}`,
          adjustedBy: userId
        });

        result.restored.push({
          returnId: returnItem.returnId,
          sku: returnItem.sku,
          categoryGroupId: categoryGroupId,
          quantity: returnItem.quantity,
          movementId: adjustmentResult.movementId
        });

      } catch (error) {
        result.success = false;
        result.errors.push({
          returnId: returnItem.returnId,
          sku: returnItem.sku,
          error: error instanceof Error ? error.message : 'Unknown error during inventory restoration'
        });
      }
    }

    return result;
  }

  /**
   * Get restoration summary for analytics
   *
   * Provides summary metrics for inventory restoration operations.
   * Useful for dashboard widgets and reports.
   *
   * @param result - InventoryRestorationResult from a restoration operation
   * @returns Summary metrics object
   */
  getRestorationSummary(result: InventoryRestorationResult): {
    totalProcessed: number;
    totalRestored: number;
    totalSkipped: number;
    totalErrors: number;
    totalQuantityRestored: number;
    successRate: number;
  } {
    const totalProcessed = result.restored.length + result.skipped.length + result.errors.length;
    const totalQuantityRestored = result.restored.reduce((sum, item) => sum + item.quantity, 0);
    const successRate = totalProcessed > 0 ? (result.restored.length / totalProcessed) * 100 : 0;

    return {
      totalProcessed,
      totalRestored: result.restored.length,
      totalSkipped: result.skipped.length,
      totalErrors: result.errors.length,
      totalQuantityRestored,
      successRate
    };
  }
}
