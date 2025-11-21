/**
 * Tests for Flipkart Returns Slice - Inventory Restoration Integration
 *
 * This test suite specifically covers the delivery-based inventory restoration feature
 * that automatically restores inventory when returns are delivered to the warehouse.
 */

import { configureStore } from '@reduxjs/toolkit';
import flipkartReturnsReducer, { uploadReturnsFile } from '../flipkartReturnsSlice';
import { flipkartReturnsService } from '../../../services/flipkartReturns/flipkartReturns.service';
import { FlipkartReturnsFactory } from '../../../services/flipkartReturns/FlipkartReturnsFactory';
import { ReturnsInventoryIntegrationService } from '../../../services/flipkartReturns/ReturnsInventoryIntegration.service';
import { FlipkartReturn, FlipkartReturnStatus, FlipkartReturnReasonCategory, FlipkartReturnType, FlipkartQCStatus } from '../../../types/flipkartReturns.type';

// Mock dependencies
jest.mock('../../../services/flipkartReturns/flipkartReturns.service');
jest.mock('../../../services/flipkartReturns/FlipkartReturnsFactory');
jest.mock('../../../services/flipkartReturns/ReturnsInventoryIntegration.service');

describe('FlipkartReturnsSlice - Inventory Restoration Integration', () => {
  let store: ReturnType<typeof configureStore>;
  let mockFactory: jest.Mocked<FlipkartReturnsFactory>;
  let mockIntegrationService: jest.Mocked<ReturnsInventoryIntegrationService>;

  const createMockReturn = (overrides?: Partial<FlipkartReturn>): FlipkartReturn => ({
    returnId: 'RET001',
    orderId: 'ORD001',
    platform: 'flipkart',
    sku: 'SKU001',
    fsn: 'FSN001',
    productTitle: 'Test Product',
    quantity: 2,
    returnReason: 'Defective product',
    returnReasonCategory: FlipkartReturnReasonCategory.DEFECTIVE,
    returnType: FlipkartReturnType.CUSTOMER_RETURN,
    returnStatus: FlipkartReturnStatus.REFUNDED,
    dates: {
      orderDate: new Date('2024-01-01'),
      returnInitiatedDate: new Date('2024-01-05'),
      returnDeliveredDate: new Date('2024-01-20'), // Delivered to warehouse
    },
    financials: {
      refundAmount: 500,
      reversePickupCharges: 50,
      commissionReversal: 25,
      settlementAmount: 525,
      restockingFee: 0,
      netLoss: 525,
    },
    resaleable: false, // Not resaleable
    qcStatus: FlipkartQCStatus.DAMAGED,
    metadata: {
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      importedAt: '2024-01-10T00:00:00Z',
    },
    ...overrides,
  });

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        flipkartReturns: flipkartReturnsReducer,
        auth: (state = { user: { uid: 'test-user-123' } }) => state,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, // Disable for tests (Dates in returns)
        }),
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock factory
    mockFactory = new FlipkartReturnsFactory({} as File) as jest.Mocked<FlipkartReturnsFactory>;
    (FlipkartReturnsFactory as jest.MockedClass<typeof FlipkartReturnsFactory>).mockImplementation(() => mockFactory);

    // Setup mock integration service
    mockIntegrationService = new ReturnsInventoryIntegrationService() as jest.Mocked<ReturnsInventoryIntegrationService>;
    (ReturnsInventoryIntegrationService as jest.MockedClass<typeof ReturnsInventoryIntegrationService>)
      .mockImplementation(() => mockIntegrationService);
  });

  describe('uploadReturnsFile - New Returns with Delivery Dates', () => {
    it('should restore inventory for new returns with returnDeliveredDate', async () => {
      // Arrange
      const deliveredReturns = [
        createMockReturn({
          returnId: 'RET001',
          sku: 'SKU001',
          quantity: 2,
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'),
          },
        }),
        createMockReturn({
          returnId: 'RET002',
          sku: 'SKU002',
          quantity: 3,
          dates: {
            orderDate: new Date('2024-01-02'),
            returnInitiatedDate: new Date('2024-01-06'),
            returnDeliveredDate: new Date('2024-01-21'),
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [
          {
            returnId: 'RET001',
            sku: 'SKU001',
            categoryGroupId: 'CG001',
            quantity: 2,
            movementId: 'MOV001',
          },
          {
            returnId: 'RET002',
            sku: 'SKU002',
            categoryGroupId: 'CG002',
            quantity: 3,
            movementId: 'MOV002',
          },
        ],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalledWith(
        deliveredReturns,
        'test-user-123'
      );
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalledTimes(1);

      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration).toEqual(mockRestorationResult);
      expect(state.inventoryRestoration?.restored.length).toBe(2);
    });

    it('should skip inventory restoration for returns without returnDeliveredDate', async () => {
      // Arrange - Returns without delivery dates
      const pendingReturns = [
        createMockReturn({
          returnId: 'RET001',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            // No returnDeliveredDate
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(pendingReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(pendingReturns);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [], // No restorations
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalledWith(
        pendingReturns,
        'test-user-123'
      );

      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration?.restored.length).toBe(0);
    });

    it('should restore inventory regardless of resaleable status when delivered', async () => {
      // Arrange - Damaged (non-resaleable) returns with delivery dates
      const damagedButDeliveredReturns = [
        createMockReturn({
          returnId: 'RET001',
          resaleable: false,
          qcStatus: FlipkartQCStatus.DAMAGED,
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'), // Delivered
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(damagedButDeliveredReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(damagedButDeliveredReturns);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [
          {
            returnId: 'RET001',
            sku: 'SKU001',
            categoryGroupId: 'CG001',
            quantity: 2,
            movementId: 'MOV001',
          },
        ],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Inventory should be restored even though item is damaged
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalled();

      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration?.restored.length).toBe(1);
      expect(state.inventoryRestoration?.restored[0].returnId).toBe('RET001');
    });
  });

  describe('uploadReturnsFile - Updated Returns with Delivery Dates', () => {
    it('should restore inventory for updated returns with newly added returnDeliveredDate', async () => {
      // Arrange - Existing return now has delivery date
      const updatedReturnsWithDeliveryDate = [
        createMockReturn({
          returnId: 'RET001',
          sku: 'SKU001',
          quantity: 2,
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'), // Newly added
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(updatedReturnsWithDeliveryDate);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001']));

      const existingReturnWithoutDeliveryDate = createMockReturn({
        returnId: 'RET001',
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          // No returnDeliveredDate in existing return
        },
      });

      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([['RET001', existingReturnWithoutDeliveryDate]])
      );
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(updatedReturnsWithDeliveryDate);
      (flipkartReturnsService.updateReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [
          {
            returnId: 'RET001',
            sku: 'SKU001',
            categoryGroupId: 'CG001',
            quantity: 2,
            movementId: 'MOV001',
          },
        ],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Updated return should trigger inventory restoration
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            returnId: 'RET001',
            dates: expect.objectContaining({
              returnDeliveredDate: expect.any(Date),
            }),
          }),
        ]),
        'test-user-123'
      );

      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration?.restored.length).toBe(1);
    });

    it('should process both new and updated returns with delivery dates', async () => {
      // Arrange - Mix of new and updated returns
      const newReturn = createMockReturn({
        returnId: 'RET001',
        sku: 'SKU001',
        quantity: 2,
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'),
        },
      });

      const updatedReturn = createMockReturn({
        returnId: 'RET002',
        sku: 'SKU002',
        quantity: 3,
        dates: {
          orderDate: new Date('2024-01-02'),
          returnInitiatedDate: new Date('2024-01-06'),
          returnDeliveredDate: new Date('2024-01-21'),
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([newReturn, updatedReturn]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET002']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([['RET002', { ...updatedReturn, dates: { ...updatedReturn.dates, returnDeliveredDate: undefined } }]])
      );
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock)
        .mockResolvedValueOnce([updatedReturn]) // For updated returns
        .mockResolvedValueOnce([newReturn]); // For new returns
      (flipkartReturnsService.updateReturns as jest.Mock).mockResolvedValue(undefined);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [
          {
            returnId: 'RET001',
            sku: 'SKU001',
            categoryGroupId: 'CG001',
            quantity: 2,
            movementId: 'MOV001',
          },
          {
            returnId: 'RET002',
            sku: 'SKU002',
            categoryGroupId: 'CG002',
            quantity: 3,
            movementId: 'MOV002',
          },
        ],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Should process both new and updated returns
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ returnId: 'RET001' }), // New return
          expect.objectContaining({ returnId: 'RET002' }), // Updated return
        ]),
        'test-user-123'
      );

      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration?.restored.length).toBe(2);
    });
  });

  describe('uploadReturnsFile - Error Handling', () => {
    it('should capture restoration errors in the result', async () => {
      // Arrange
      const deliveredReturns = [
        createMockReturn({
          returnId: 'RET001',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'),
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: false,
        restored: [],
        skipped: [],
        errors: [
          {
            returnId: 'RET001',
            sku: 'SKU001',
            error: 'Product not found in catalog',
          },
        ],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration?.success).toBe(false);
      expect(state.inventoryRestoration?.errors.length).toBe(1);
      expect(state.inventoryRestoration?.errors[0].returnId).toBe('RET001');
    });

    it('should include skipped returns in the result', async () => {
      // Arrange
      const deliveredReturns = [
        createMockReturn({
          returnId: 'RET001',
          sku: 'UNKNOWN_SKU',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'),
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [
          {
            returnId: 'RET001',
            sku: 'UNKNOWN_SKU',
            reason: 'Product not found in catalog',
          },
        ],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      const state = (store.getState() as any).flipkartReturns;
      expect(state.inventoryRestoration?.skipped.length).toBe(1);
      expect(state.inventoryRestoration?.skipped[0].reason).toBe('Product not found in catalog');
    });
  });

  describe('uploadReturnsFile - Edge Cases', () => {
    it('should handle empty returns array gracefully', async () => {
      // Arrange
      mockFactory.process = jest.fn().mockResolvedValue([]);

      // Act & Assert - Should reject with error message
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      expect(result.type).toBe('flipkartReturns/uploadFile/rejected');
      expect((result as any).payload).toBe('No valid returns found in file');
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).not.toHaveBeenCalled();
    });

    it('should not call restoration service when no returns to process', async () => {
      // Arrange - Returns exist but no new or updated returns
      const returns = [createMockReturn()];

      mockFactory.process = jest.fn().mockResolvedValue(returns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(new Map());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue([]);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Should not call restoration when no returns to process
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).not.toHaveBeenCalled();
    });

    it('should use system userId when auth user is not available', async () => {
      // Arrange - Store without auth user
      const storeWithoutAuth = configureStore({
        reducer: {
          flipkartReturns: flipkartReturnsReducer,
          auth: (state = { user: null }) => state,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false, // Disable for tests (Dates in returns)
          }),
      });

      const deliveredReturns = [
        createMockReturn({
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'),
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set());
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.saveReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await storeWithoutAuth.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Should use 'system' as userId
      expect(mockIntegrationService.restoreInventoryFromDeliveredReturns).toHaveBeenCalledWith(
        deliveredReturns,
        'system'
      );
    });
  });

  describe('uploadReturnsFile - Delivered Returns Protection', () => {
    it('should NOT update returns that already have returnDeliveredDate', async () => {
      // Arrange - Existing return with delivery date should be protected
      const existingDeliveredReturn = createMockReturn({
        returnId: 'RET001',
        sku: 'SKU001',
        quantity: 2,
        returnReason: 'Defective product',
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'), // Already delivered - PROTECTED
        },
      });

      const newReturnDataWithDifferentValues = createMockReturn({
        returnId: 'RET001',
        sku: 'SKU001',
        quantity: 3, // Different quantity - should NOT update
        returnReason: 'Customer request', // Different reason - should NOT update
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'),
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([newReturnDataWithDifferentValues]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([['RET001', existingDeliveredReturn]])
      );

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Should NOT call enrichReturnsWithPricing or updateReturns for protected returns
      expect(flipkartReturnsService.enrichReturnsWithPricing).not.toHaveBeenCalled();
      expect(flipkartReturnsService.updateReturns).not.toHaveBeenCalled();

      // Verify skipped returns are tracked in the result payload
      expect(result.type).toBe('flipkartReturns/uploadFile/fulfilled');
      expect((result as any).payload.skippedDeliveredReturns).toHaveLength(1);
      expect((result as any).payload.skippedDeliveredReturns[0].returnId).toBe('RET001');
    });

    it('should populate skippedDeliveredReturns array with protected returns', async () => {
      // Arrange
      const deliveredReturn1 = createMockReturn({
        returnId: 'RET001',
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'),
        },
      });

      const deliveredReturn2 = createMockReturn({
        returnId: 'RET002',
        dates: {
          orderDate: new Date('2024-01-02'),
          returnInitiatedDate: new Date('2024-01-06'),
          returnDeliveredDate: new Date('2024-01-21'),
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([deliveredReturn1, deliveredReturn2]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001', 'RET002']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([
          ['RET001', deliveredReturn1],
          ['RET002', deliveredReturn2],
        ])
      );

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      expect(result.type).toBe('flipkartReturns/uploadFile/fulfilled');
      expect((result as any).payload.skippedDeliveredReturns).toHaveLength(2);
      expect((result as any).payload.skippedDeliveredReturns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ returnId: 'RET001' }),
          expect.objectContaining({ returnId: 'RET002' }),
        ])
      );
    });

    it('should include skipped count in success message', async () => {
      // Arrange
      const deliveredReturn = createMockReturn({
        returnId: 'RET001',
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'),
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([deliveredReturn]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([['RET001', deliveredReturn]])
      );

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      const state = (store.getState() as any).flipkartReturns;
      expect(state.successMessage).toContain('1 delivered returns skipped (already completed)');
    });

    it('should handle mixed scenario: some delivered, some not', async () => {
      // Arrange - Mix of delivered and non-delivered returns
      const deliveredReturn = createMockReturn({
        returnId: 'RET001',
        sku: 'SKU001',
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'), // PROTECTED
        },
      });

      const pendingReturnExisting = createMockReturn({
        returnId: 'RET002',
        sku: 'SKU002',
        quantity: 2,
        dates: {
          orderDate: new Date('2024-01-02'),
          returnInitiatedDate: new Date('2024-01-06'),
          // No delivery date - can be updated
        },
      });

      const pendingReturnNew = createMockReturn({
        returnId: 'RET002',
        sku: 'SKU002',
        quantity: 5, // Updated quantity
        dates: {
          orderDate: new Date('2024-01-02'),
          returnInitiatedDate: new Date('2024-01-06'),
          // Still no delivery date
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([deliveredReturn, pendingReturnNew]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001', 'RET002']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([
          ['RET001', deliveredReturn],
          ['RET002', pendingReturnExisting],
        ])
      );
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue([pendingReturnNew]);
      (flipkartReturnsService.updateReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert
      expect(result.type).toBe('flipkartReturns/uploadFile/fulfilled');
      expect((result as any).payload.skippedDeliveredReturns).toHaveLength(1); // Only RET001 skipped
      expect((result as any).payload.updatedReturns).toHaveLength(1); // Only RET002 updated

      // Verify only non-delivered return was enriched and updated
      expect(flipkartReturnsService.enrichReturnsWithPricing).toHaveBeenCalledWith([pendingReturnNew]);
      expect(flipkartReturnsService.updateReturns).toHaveBeenCalledWith([pendingReturnNew]);

      const state = (store.getState() as any).flipkartReturns;
      expect(state.successMessage).toContain('1 delivered returns skipped (already completed)');
      expect(state.successMessage).toContain('Successfully updated 1 existing returns');
    });

    it('should handle edge case: all returns already delivered', async () => {
      // Arrange - All returns are delivered and protected
      const deliveredReturns = [
        createMockReturn({
          returnId: 'RET001',
          dates: {
            orderDate: new Date('2024-01-01'),
            returnInitiatedDate: new Date('2024-01-05'),
            returnDeliveredDate: new Date('2024-01-20'),
          },
        }),
        createMockReturn({
          returnId: 'RET002',
          dates: {
            orderDate: new Date('2024-01-02'),
            returnInitiatedDate: new Date('2024-01-06'),
            returnDeliveredDate: new Date('2024-01-21'),
          },
        }),
      ];

      mockFactory.process = jest.fn().mockResolvedValue(deliveredReturns);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001', 'RET002']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([
          ['RET001', deliveredReturns[0]],
          ['RET002', deliveredReturns[1]],
        ])
      );

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - No updates should occur
      expect(result.type).toBe('flipkartReturns/uploadFile/fulfilled');
      expect((result as any).payload.skippedDeliveredReturns).toHaveLength(2);
      expect((result as any).payload.updatedReturns).toHaveLength(0);
      expect((result as any).payload.newReturns).toHaveLength(0);

      expect(flipkartReturnsService.enrichReturnsWithPricing).not.toHaveBeenCalled();
      expect(flipkartReturnsService.updateReturns).not.toHaveBeenCalled();

      const state = (store.getState() as any).flipkartReturns;
      expect(state.successMessage).toContain('2 delivered returns skipped (already completed)');
    });

    it('should handle edge case: no returns delivered (normal update flow)', async () => {
      // Arrange - None of the returns are delivered
      const existingReturn = createMockReturn({
        returnId: 'RET001',
        quantity: 2,
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          // No delivery date
        },
      });

      const updatedReturn = createMockReturn({
        returnId: 'RET001',
        quantity: 3, // Should update
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          // Still no delivery date
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([updatedReturn]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([['RET001', existingReturn]])
      );
      (flipkartReturnsService.enrichReturnsWithPricing as jest.Mock).mockResolvedValue([updatedReturn]);
      (flipkartReturnsService.updateReturns as jest.Mock).mockResolvedValue(undefined);

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Normal update flow
      expect(result.type).toBe('flipkartReturns/uploadFile/fulfilled');
      expect((result as any).payload.skippedDeliveredReturns).toHaveLength(0);
      expect((result as any).payload.updatedReturns).toHaveLength(1);

      expect(flipkartReturnsService.enrichReturnsWithPricing).toHaveBeenCalledWith([updatedReturn]);
      expect(flipkartReturnsService.updateReturns).toHaveBeenCalledWith([updatedReturn]);

      const state = (store.getState() as any).flipkartReturns;
      expect(state.successMessage).not.toContain('delivered returns skipped');
      expect(state.successMessage).toContain('Successfully updated 1 existing returns');
    });

    it('should skip update even if new data has different fields', async () => {
      // Arrange - Verify that any difference in data doesn't bypass protection
      const existingDeliveredReturn = createMockReturn({
        returnId: 'RET001',
        sku: 'SKU001',
        quantity: 2,
        returnReason: 'Defective product',
        qcStatus: FlipkartQCStatus.DAMAGED,
        resaleable: false,
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-20'),
        },
      });

      const newReturnDataWithManyDifferences = createMockReturn({
        returnId: 'RET001',
        sku: 'SKU001',
        quantity: 10, // Different quantity
        returnReason: 'Customer changed mind', // Different reason
        qcStatus: FlipkartQCStatus.RESALEABLE, // Different QC status
        resaleable: true, // Different resaleable flag
        dates: {
          orderDate: new Date('2024-01-01'),
          returnInitiatedDate: new Date('2024-01-05'),
          returnDeliveredDate: new Date('2024-01-25'), // Even different delivery date
        },
      });

      mockFactory.process = jest.fn().mockResolvedValue([newReturnDataWithManyDifferences]);
      (flipkartReturnsService.batchCheckExistingReturns as jest.Mock).mockResolvedValue(new Set(['RET001']));
      (flipkartReturnsService.batchFetchExistingReturns as jest.Mock).mockResolvedValue(
        new Map([['RET001', existingDeliveredReturn]])
      );

      const mockRestorationResult = {
        success: true,
        restored: [],
        skipped: [],
        errors: [],
      };

      mockIntegrationService.restoreInventoryFromDeliveredReturns = jest.fn().mockResolvedValue(mockRestorationResult);

      // Act
      const result = await store.dispatch(uploadReturnsFile({} as File) as any);

      // Assert - Should NOT update despite many differences
      expect(flipkartReturnsService.enrichReturnsWithPricing).not.toHaveBeenCalled();
      expect(flipkartReturnsService.updateReturns).not.toHaveBeenCalled();

      // Verify the return was skipped and protection worked
      expect(result.type).toBe('flipkartReturns/uploadFile/fulfilled');
      expect((result as any).payload.skippedDeliveredReturns).toHaveLength(1);
      expect((result as any).payload.skippedDeliveredReturns[0].quantity).toBe(2); // Original quantity preserved
      expect((result as any).payload.skippedDeliveredReturns[0].resaleable).toBe(false); // Original resaleable preserved
    });
  });
});
