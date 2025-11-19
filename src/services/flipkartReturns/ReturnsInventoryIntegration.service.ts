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
  private readonly inventoryService: InventoryService;

  constructor() {
    this.productService = new ProductService();
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

    // Fetch all products once for efficient mapping
    const products = await this.productService.getProducts({});
    const productsBySku = new Map(
      products.map(p => [p.sku, p])
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

        if (!product.categoryGroupId) {
          result.skipped.push({
            returnId: returnItem.returnId,
            sku: returnItem.sku,
            reason: 'Product has no category group mapping'
          });
          continue;
        }

        // Use adjustInventoryManually for additions with proper audit trail
        const adjustmentResult = await this.inventoryService.adjustInventoryManually({
          categoryGroupId: product.categoryGroupId,
          adjustmentType: 'increase',
          quantity: returnItem.quantity,
          reason: 'stock_returned', // Predefined reason code
          notes: `Automatic restoration from return ${returnItem.returnId} - QC Status: ${returnItem.qcStatus || 'Resaleable'}`,
          adjustedBy: userId
        });

        result.restored.push({
          returnId: returnItem.returnId,
          sku: returnItem.sku,
          categoryGroupId: product.categoryGroupId,
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
