import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { FlipkartReturnsService } from "../flipkartReturns.service";
import {
  FlipkartReturn,
  FlipkartReturnStatus,
  FlipkartQCStatus,
  FlipkartReturnReasonCategory,
  FlipkartReturnType,
} from "../../../types/flipkartReturns.type";

// Mock Firebase
jest.mock("firebase/firestore");
jest.mock("../../firebase.service", () => ({
  db: {},
}));

describe("FlipkartReturnsService", () => {
  let service: FlipkartReturnsService;

  const mockReturn: FlipkartReturn = {
    returnId: "RET001",
    orderId: "ORD001",
    platform: "flipkart",
    sku: "SKU123",
    fsn: "FSN123",
    productTitle: "Test Product",
    quantity: 1,
    returnReason: "Defective product",
    returnReasonCategory: FlipkartReturnReasonCategory.DEFECTIVE,
    returnType: FlipkartReturnType.CUSTOMER_RETURN,
    returnStatus: FlipkartReturnStatus.INITIATED,
    dates: {
      orderDate: new Date("2024-01-15"),
      returnInitiatedDate: new Date("2024-01-20"),
    },
    financials: {
      refundAmount: 1500,
      reversePickupCharges: 100,
      commissionReversal: 200,
      settlementAmount: 1400,
      restockingFee: 0,
      netLoss: 1400,
    },
    qcStatus: FlipkartQCStatus.PENDING,
    resaleable: false,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    service = new FlipkartReturnsService();
    jest.clearAllMocks();
  });

  describe("saveReturn", () => {
    it("should save a single return to Firestore", async () => {
      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await service.saveReturn(mockReturn);

      expect(doc).toHaveBeenCalledWith(expect.any(Object), "flipkartReturns", "RET001");
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe("saveReturns", () => {
    it("should save multiple returns using batch write", async () => {
      const mockReturns = [mockReturn, { ...mockReturn, returnId: "RET002" }];

      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };

      (writeBatch as jest.Mock).mockReturnValue(mockBatch);
      (doc as jest.Mock).mockReturnValue({ id: "mock-doc" });

      await service.saveReturns(mockReturns);

      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it("should throw error when no returns provided", async () => {
      await expect(service.saveReturns([])).rejects.toThrow("No returns to save");
    });

    it("should handle batches of more than 500 returns", async () => {
      const mockReturns = Array.from({ length: 600 }, (_, i) => ({
        ...mockReturn,
        returnId: `RET${i + 1}`,
      }));

      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };

      (writeBatch as jest.Mock).mockReturnValue(mockBatch);
      (doc as jest.Mock).mockReturnValue({ id: "mock-doc" });

      await service.saveReturns(mockReturns);

      // Should create 2 batches (500 + 100)
      expect(writeBatch).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    });
  });

  describe("getReturnById", () => {
    it("should return a return when it exists", async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          ...mockReturn,
          dates: {
            orderDate: {
              toDate: () => mockReturn.dates.orderDate,
            },
            returnInitiatedDate: {
              toDate: () => mockReturn.dates.returnInitiatedDate,
            },
          },
        }),
      };

      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getReturnById("RET001");

      expect(result).toBeTruthy();
      expect(result?.returnId).toBe("RET001");
      expect(doc).toHaveBeenCalledWith(expect.any(Object), "flipkartReturns", "RET001");
    });

    it("should return null when return does not exist", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getReturnById("RET001");

      expect(result).toBeNull();
    });
  });

  describe("getAllReturns", () => {
    it("should return all returns ordered by return initiated date", async () => {
      const mockReturns = [
        {
          ...mockReturn,
          dates: {
            orderDate: {
              toDate: () => mockReturn.dates.orderDate,
            },
            returnInitiatedDate: {
              toDate: () => mockReturn.dates.returnInitiatedDate,
            },
          },
        },
        {
          ...mockReturn,
          returnId: "RET002",
          dates: {
            orderDate: {
              toDate: () => new Date("2024-01-16"),
            },
            returnInitiatedDate: {
              toDate: () => new Date("2024-01-21"),
            },
          },
        },
      ];

      const mockQuerySnapshot = {
        docs: mockReturns.map((data) => ({ data: () => data })),
      };

      (collection as jest.Mock).mockReturnValue({ id: "flipkartReturns" });
      (query as jest.Mock).mockReturnValue({ id: "mock-query" });
      (orderBy as jest.Mock).mockReturnValue({ id: "mock-orderby" });
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getAllReturns();

      expect(result).toHaveLength(2);
      expect(collection).toHaveBeenCalledWith(expect.any(Object), "flipkartReturns");
      expect(orderBy).toHaveBeenCalledWith("dates.returnInitiatedDate", "desc");
    });
  });

  describe("getReturnsByDateRange", () => {
    it("should return returns within date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const mockQuerySnapshot = {
        docs: [
          {
            data: () => ({
              ...mockReturn,
              dates: {
                orderDate: Timestamp.fromDate(mockReturn.dates.orderDate),
                returnInitiatedDate: Timestamp.fromDate(mockReturn.dates.returnInitiatedDate),
              },
            }),
          },
        ],
      };

      (collection as jest.Mock).mockReturnValue({ id: "flipkartReturns" });
      (query as jest.Mock).mockReturnValue({ id: "mock-query" });
      (where as jest.Mock).mockReturnValue({ id: "mock-where" });
      (orderBy as jest.Mock).mockReturnValue({ id: "mock-orderby" });
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (Timestamp.fromDate as jest.Mock).mockImplementation((date) => ({ toDate: () => date }));

      const result = await service.getReturnsByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(where).toHaveBeenCalledWith("dates.returnInitiatedDate", ">=", expect.anything());
      expect(where).toHaveBeenCalledWith("dates.returnInitiatedDate", "<=", expect.anything());
    });
  });

  describe("getReturnsBySKU", () => {
    it("should return returns for specific SKU", async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            data: () => ({
              ...mockReturn,
              dates: {
                orderDate: Timestamp.fromDate(mockReturn.dates.orderDate),
                returnInitiatedDate: Timestamp.fromDate(mockReturn.dates.returnInitiatedDate),
              },
            }),
          },
        ],
      };

      (collection as jest.Mock).mockReturnValue({ id: "flipkartReturns" });
      (query as jest.Mock).mockReturnValue({ id: "mock-query" });
      (where as jest.Mock).mockReturnValue({ id: "mock-where" });
      (orderBy as jest.Mock).mockReturnValue({ id: "mock-orderby" });
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getReturnsBySKU("SKU123");

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe("SKU123");
      expect(where).toHaveBeenCalledWith("sku", "==", "SKU123");
    });
  });

  describe("getReturnsByStatus", () => {
    it("should return returns with specific status", async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            data: () => ({
              ...mockReturn,
              dates: {
                orderDate: Timestamp.fromDate(mockReturn.dates.orderDate),
                returnInitiatedDate: Timestamp.fromDate(mockReturn.dates.returnInitiatedDate),
              },
            }),
          },
        ],
      };

      (collection as jest.Mock).mockReturnValue({ id: "flipkartReturns" });
      (query as jest.Mock).mockReturnValue({ id: "mock-query" });
      (where as jest.Mock).mockReturnValue({ id: "mock-where" });
      (orderBy as jest.Mock).mockReturnValue({ id: "mock-orderby" });
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getReturnsByStatus(FlipkartReturnStatus.INITIATED);

      expect(result).toHaveLength(1);
      expect(result[0].returnStatus).toBe(FlipkartReturnStatus.INITIATED);
      expect(where).toHaveBeenCalledWith("returnStatus", "==", FlipkartReturnStatus.INITIATED);
    });
  });

  describe("updateReturnStatus", () => {
    it("should update return status", async () => {
      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.updateReturnStatus("RET001", FlipkartReturnStatus.APPROVED);

      expect(updateDoc).toHaveBeenCalledWith(
        { id: "RET001" },
        expect.objectContaining({
          returnStatus: FlipkartReturnStatus.APPROVED,
        })
      );
    });
  });

  describe("updateQCStatus", () => {
    it("should update QC status and set resaleable flag", async () => {
      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.updateQCStatus("RET001", FlipkartQCStatus.RESALEABLE);

      expect(updateDoc).toHaveBeenCalledWith(
        { id: "RET001" },
        expect.objectContaining({
          qcStatus: FlipkartQCStatus.RESALEABLE,
          resaleable: true,
        })
      );
    });

    it("should set resaleable to false for non-resaleable QC status", async () => {
      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.updateQCStatus("RET001", FlipkartQCStatus.DAMAGED);

      expect(updateDoc).toHaveBeenCalledWith(
        { id: "RET001" },
        expect.objectContaining({
          qcStatus: FlipkartQCStatus.DAMAGED,
          resaleable: false,
        })
      );
    });
  });

  describe("deleteReturn", () => {
    it("should delete a return", async () => {
      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await service.deleteReturn("RET001");

      expect(deleteDoc).toHaveBeenCalledWith({ id: "RET001" });
    });
  });

  describe("returnExists", () => {
    it("should return true when return exists", async () => {
      const mockDocSnap = {
        exists: () => true,
      };

      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.returnExists("RET001");

      expect(result).toBe(true);
    });

    it("should return false when return does not exist", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      (doc as jest.Mock).mockReturnValue({ id: "RET001" });
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.returnExists("RET001");

      expect(result).toBe(false);
    });
  });

  describe("batchCheckExistingReturns", () => {
    it("should return empty set when no return IDs provided", async () => {
      const result = await service.batchCheckExistingReturns([]);
      expect(result.size).toBe(0);
    });

    it("should identify duplicates from existing returns", async () => {
      const existingReturns = [
        { id: "RET001", data: () => ({}) },
        { id: "RET002", data: () => ({}) },
        { id: "RET003", data: () => ({}) },
      ];

      const mockSnapshot = {
        forEach: (callback: (doc: any) => void) => {
          existingReturns.forEach(callback);
        },
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const returnIds = ["RET001", "RET004", "RET002", "RET005"];
      const duplicates = await service.batchCheckExistingReturns(returnIds);

      expect(duplicates.size).toBe(2);
      expect(duplicates.has("RET001")).toBe(true);
      expect(duplicates.has("RET002")).toBe(true);
      expect(duplicates.has("RET004")).toBe(false);
      expect(duplicates.has("RET005")).toBe(false);
    });

    it("should return empty set when no duplicates found", async () => {
      const existingReturns = [
        { id: "RET001", data: () => ({}) },
        { id: "RET002", data: () => ({}) },
      ];

      const mockSnapshot = {
        forEach: (callback: (doc: any) => void) => {
          existingReturns.forEach(callback);
        },
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const returnIds = ["RET003", "RET004", "RET005"];
      const duplicates = await service.batchCheckExistingReturns(returnIds);

      expect(duplicates.size).toBe(0);
    });

    it("should handle permission errors gracefully", async () => {
      const permissionError = new Error("No matching allow statements");
      (getDocs as jest.Mock).mockRejectedValue(permissionError);

      const returnIds = ["RET001", "RET002", "RET003"];
      const duplicates = await service.batchCheckExistingReturns(returnIds);

      // Should return empty set when permission error occurs
      expect(duplicates.size).toBe(0);
    });
  });

  describe("getReturnsWithFilters", () => {
    beforeEach(() => {
      // Mock getAllReturns to return test data
      jest.spyOn(service, "getAllReturns").mockResolvedValue([
        mockReturn,
        {
          ...mockReturn,
          returnId: "RET002",
          sku: "SKU456",
          returnStatus: FlipkartReturnStatus.APPROVED,
          returnReasonCategory: FlipkartReturnReasonCategory.QUALITY_ISSUE,
          qcStatus: FlipkartQCStatus.RESALEABLE,
          resaleable: true,
          financials: {
            ...mockReturn.financials,
            refundAmount: 2000,
          },
        },
      ]);
    });

    it("should filter by search query", async () => {
      const filters = {
        searchQuery: "SKU456",
      };

      const result = await service.getReturnsWithFilters(filters);

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe("SKU456");
    });

    it("should filter by status", async () => {
      const filters = {
        status: [FlipkartReturnStatus.APPROVED],
      };

      const result = await service.getReturnsWithFilters(filters);

      expect(result).toHaveLength(1);
      expect(result[0].returnStatus).toBe(FlipkartReturnStatus.APPROVED);
    });

    it("should filter by resaleable only", async () => {
      const filters = {
        resaleableOnly: true,
      };

      const result = await service.getReturnsWithFilters(filters);

      expect(result).toHaveLength(1);
      expect(result[0].resaleable).toBe(true);
    });

    it("should filter by refund amount range", async () => {
      const filters = {
        minRefundAmount: 1800,
        maxRefundAmount: 2500,
      };

      const result = await service.getReturnsWithFilters(filters);

      expect(result).toHaveLength(1);
      expect(result[0].financials.refundAmount).toBeGreaterThanOrEqual(1800);
      expect(result[0].financials.refundAmount).toBeLessThanOrEqual(2500);
    });

    it("should combine multiple filters", async () => {
      const filters = {
        status: [FlipkartReturnStatus.APPROVED],
        resaleableOnly: true,
      };

      const result = await service.getReturnsWithFilters(filters);

      expect(result).toHaveLength(1);
      expect(result[0].returnStatus).toBe(FlipkartReturnStatus.APPROVED);
      expect(result[0].resaleable).toBe(true);
    });
  });
});
