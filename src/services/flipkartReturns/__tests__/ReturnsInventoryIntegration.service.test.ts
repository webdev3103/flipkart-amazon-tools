/**
 * Tests for ReturnsInventoryIntegrationService
 *
 * Comprehensive test coverage for inventory restoration from resaleable returns
 */

import { ReturnsInventoryIntegrationService } from '../ReturnsInventoryIntegration.service';
import { ProductService } from '../../product.service';
import { CategoryService } from '../../category.service';
import { InventoryService } from '../../inventory.service';
import { FlipkartReturn, FlipkartReturnStatus, FlipkartReturnReasonCategory, FlipkartReturnType, FlipkartQCStatus } from '../../../types/flipkartReturns.type';

// Mock dependencies
jest.mock('../../product.service');
jest.mock('../../category.service');
jest.mock('../../inventory.service');

describe('ReturnsInventoryIntegrationService', () => {
  let service: ReturnsInventoryIntegrationService;
  let mockProductService: jest.Mocked<ProductService>;
  let mockCategoryService: jest.Mocked<CategoryService>;
  let mockInventoryService: jest.Mocked<InventoryService>;

  const createMockReturn = (overrides?: Partial<FlipkartReturn>): FlipkartReturn => ({
    returnId: 'RET001',
    orderId: 'ORD001',
    platform: 'flipkart',
    sku: 'SKU001',
    fsn: 'FSN001',
    productTitle: 'Test Product',
    quantity: 1,
    returnReason: 'Defective product',
    returnReasonCategory: FlipkartReturnReasonCategory.DEFECTIVE,
    returnType: FlipkartReturnType.CUSTOMER_RETURN,
    returnStatus: FlipkartReturnStatus.REFUNDED,
    dates: {
      orderDate: new Date('2024-01-01'),
      returnInitiatedDate: new Date('2024-01-05'),
    },
    financials: {
      refundAmount: 500,
      reversePickupCharges: 50,
      commissionReversal: 25,
      settlementAmount: 525,
      restockingFee: 0,
      netLoss: 525,
    },
    resaleable: true,
    qcStatus: FlipkartQCStatus.RESALEABLE,
    metadata: {
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      importedAt: '2024-01-10T00:00:00Z',
    },
    ...overrides,
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    service = new ReturnsInventoryIntegrationService();

    // Get mocked instances
    mockProductService = (service as any).productService;
    mockCategoryService = (service as any).categoryService;
    mockInventoryService = (service as any).inventoryService;

    // Setup default mock for categories (empty array by default)
    mockCategoryService.getCategories = jest.fn().mockResolvedValue([]);
  });

  describe('restoreInventoryFromReturns', () => {
    it('should restore inventory for resaleable returns', async () => {
      // Arrange
      const returns = [createMockReturn()];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 10,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreInventoryFromReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(1);
      expect(result.restored[0]).toEqual({
        returnId: 'RET001',
        sku: 'SKU001',
        categoryGroupId: 'CG001',
        quantity: 1,
        movementId: 'MOV001',
      });
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      expect(mockInventoryService.adjustInventoryManually).toHaveBeenCalledWith({
        categoryGroupId: 'CG001',
        adjustmentType: 'increase',
        quantity: 1,
        reason: 'stock_returned',
        notes: expect.stringContaining('Automatic restoration from return RET001'),
        adjustedBy: 'user123',
      });
    });

    it('should skip non-resaleable returns', async () => {
      // Arrange
      const returns = [
        createMockReturn({ resaleable: false, qcStatus: FlipkartQCStatus.DAMAGED }),
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.restoreInventoryFromReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockInventoryService.adjustInventoryManually).not.toHaveBeenCalled();
    });

    it('should skip returns with products not in catalog', async () => {
      // Arrange
      const returns = [createMockReturn({ sku: 'UNKNOWN_SKU' })];

      mockProductService.getProducts = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.restoreInventoryFromReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]).toEqual({
        returnId: 'RET001',
        sku: 'UNKNOWN_SKU',
        reason: 'Product not found in catalog',
      });
    });

    it('should skip returns with products lacking categoryGroupId', async () => {
      // Arrange
      const returns = [createMockReturn()];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          // categoryGroupId missing
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);

      // Act
      const result = await service.restoreInventoryFromReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]).toEqual({
        returnId: 'RET001',
        sku: 'SKU001',
        reason: 'Product has no category group mapping',
      });
    });

    it('should handle errors during inventory adjustment', async () => {
      // Arrange
      const returns = [createMockReturn()];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockRejectedValue(
        new Error('Inventory adjustment failed')
      );

      // Act
      const result = await service.restoreInventoryFromReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        returnId: 'RET001',
        sku: 'SKU001',
        error: 'Inventory adjustment failed',
      });
    });

    it('should process multiple returns with mixed results', async () => {
      // Arrange
      const returns = [
        createMockReturn({ returnId: 'RET001', sku: 'SKU001' }), // Success
        createMockReturn({ returnId: 'RET002', sku: 'UNKNOWN_SKU' }), // Skip - product not found
        createMockReturn({ returnId: 'RET003', sku: 'SKU003', resaleable: false }), // Skip - not resaleable
      ];

      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product 1',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 10,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreInventoryFromReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(1);
      expect(result.skipped).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(mockInventoryService.adjustInventoryManually).toHaveBeenCalledTimes(1);
    });

    it('should handle empty returns array', async () => {
      // Act
      const result = await service.restoreInventoryFromReturns([], 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockProductService.getProducts).not.toHaveBeenCalled();
    });
  });

  describe('restoreSingleReturn', () => {
    it('should restore inventory for a single resaleable return', async () => {
      // Arrange
      const returnItem = createMockReturn();
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 10,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreSingleReturn(returnItem, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(1);
    });
  });

  describe('restoreInventoryFromDeliveredReturns', () => {
    it('should restore inventory for returns with returnDeliveredDate', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }),
      ];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 10,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(1);
      expect(result.restored[0]).toEqual({
        returnId: 'RET001',
        sku: 'SKU001',
        categoryGroupId: 'CG001',
        quantity: 1,
        movementId: 'MOV001',
      });
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      expect(mockInventoryService.adjustInventoryManually).toHaveBeenCalledWith({
        categoryGroupId: 'CG001',
        adjustmentType: 'increase',
        quantity: 1,
        reason: 'stock_returned',
        notes: expect.stringContaining('Automatic restoration from delivered return RET001'),
        adjustedBy: 'user123',
      });
    });

    it('should skip returns without returnDeliveredDate', async () => {
      // Arrange
      const returns = [
        createMockReturn({
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            // No returnDeliveredDate
          },
        }),
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockInventoryService.adjustInventoryManually).not.toHaveBeenCalled();
    });

    it('should restore inventory regardless of resaleable status when delivered', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          resaleable: false, // Not resaleable
          qcStatus: FlipkartQCStatus.DAMAGED,
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate, // But delivered
          },
        }),
      ];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 10,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(1);
      expect(mockInventoryService.adjustInventoryManually).toHaveBeenCalledTimes(1);
    });

    it('should skip delivered returns with products not in catalog', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          sku: 'UNKNOWN_SKU',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }),
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]).toEqual({
        returnId: 'RET001',
        sku: 'UNKNOWN_SKU',
        reason: 'Product not found in catalog',
      });
    });

    it('should skip delivered returns with products lacking categoryGroupId', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }),
      ];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          // categoryGroupId missing
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]).toEqual({
        returnId: 'RET001',
        sku: 'SKU001',
        reason: 'Product has no category group mapping',
      });
    });

    it('should handle errors during inventory adjustment for delivered returns', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }),
      ];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockRejectedValue(
        new Error('Inventory adjustment failed')
      );

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        returnId: 'RET001',
        sku: 'SKU001',
        error: 'Inventory adjustment failed',
      });
    });

    it('should process multiple delivered returns with mixed results', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          returnId: 'RET001',
          sku: 'SKU001',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }), // Success
        createMockReturn({
          returnId: 'RET002',
          sku: 'UNKNOWN_SKU',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }), // Skip - product not found
        createMockReturn({
          returnId: 'RET003',
          sku: 'SKU003',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            // No returnDeliveredDate
          },
        }), // Skip - not delivered
      ];

      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product 1',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 10,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(1);
      expect(result.skipped).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(mockInventoryService.adjustInventoryManually).toHaveBeenCalledTimes(1);
    });

    it('should handle empty returns array', async () => {
      // Act
      const result = await service.restoreInventoryFromDeliveredReturns([], 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockProductService.getProducts).not.toHaveBeenCalled();
    });

    it('should restore multiple quantities for delivered returns', async () => {
      // Arrange
      const deliveredDate = new Date('2024-01-20');
      const returns = [
        createMockReturn({
          quantity: 5,
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: deliveredDate,
          },
        }),
      ];
      const mockProducts = [
        {
          id: 'PROD001',
          sku: 'SKU001',
          name: 'Test Product',
          categoryGroupId: 'CG001',
        },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue(mockProducts);
      mockInventoryService.adjustInventoryManually = jest.fn().mockResolvedValue({
        newInventoryLevel: 15,
        movementId: 'MOV001',
      });

      // Act
      const result = await service.restoreInventoryFromDeliveredReturns(returns, 'user123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.restored[0].quantity).toBe(5);
      expect(mockInventoryService.adjustInventoryManually).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 5,
        })
      );
    });
  });

  describe('getRestorationSummary', () => {
    it('should calculate summary metrics correctly', () => {
      // Arrange
      const mockResult = {
        success: true,
        restored: [
          { returnId: 'RET001', sku: 'SKU001', categoryGroupId: 'CG001', quantity: 2, movementId: 'MOV001' },
          { returnId: 'RET002', sku: 'SKU002', categoryGroupId: 'CG002', quantity: 3, movementId: 'MOV002' },
        ],
        skipped: [
          { returnId: 'RET003', sku: 'SKU003', reason: 'Product not found' },
        ],
        errors: [
          { returnId: 'RET004', sku: 'SKU004', error: 'Adjustment failed' },
        ],
      };

      // Act
      const summary = service.getRestorationSummary(mockResult);

      // Assert
      expect(summary).toEqual({
        totalProcessed: 4,
        totalRestored: 2,
        totalSkipped: 1,
        totalErrors: 1,
        totalQuantityRestored: 5, // 2 + 3
        successRate: 50, // 2/4 * 100
      });
    });

    it('should handle empty result', () => {
      // Arrange
      const mockResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      // Act
      const summary = service.getRestorationSummary(mockResult);

      // Assert
      expect(summary).toEqual({
        totalProcessed: 0,
        totalRestored: 0,
        totalSkipped: 0,
        totalErrors: 0,
        totalQuantityRestored: 0,
        successRate: 0,
      });
    });
  });
});
