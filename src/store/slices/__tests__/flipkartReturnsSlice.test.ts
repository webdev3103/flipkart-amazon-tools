import flipkartReturnsReducer, {
  setFilters,
  clearFilters,
  setSelectedReturn,
  clearError,
  clearSuccessMessage,
  resetUploadState,
  uploadReturnsFile,
  fetchReturns,
  fetchReturnsByDateRange,
  fetchReturnsWithFilters,
  fetchReturnById,
  updateReturnStatus,
  updateQCStatus,
  deleteReturn,
} from "../flipkartReturnsSlice";
import {
  FlipkartReturn,
  FlipkartReturnStatus,
  FlipkartQCStatus,
  FlipkartReturnReasonCategory,
  FlipkartReturnType,
  ReturnsFilters,
} from "../../../types/flipkartReturns.type";
import { flipkartReturnsService } from "../../../services/flipkartReturns/flipkartReturns.service";
import { FlipkartReturnsFactory } from "../../../services/flipkartReturns/FlipkartReturnsFactory";

// Mock dependencies
jest.mock("../../../services/flipkartReturns/flipkartReturns.service");
jest.mock("../../../services/flipkartReturns/FlipkartReturnsFactory");

describe("flipkartReturnsSlice", () => {
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

  const initialState = {
    returns: [],
    filteredReturns: [],
    selectedReturn: null,
    filters: {},
    loading: false,
    uploading: false,
    uploadProgress: 0,
    error: null,
    successMessage: null,
    inventoryRestoration: null,
  };

  describe("reducer", () => {
    it("should return the initial state", () => {
      expect(flipkartReturnsReducer(undefined, { type: "unknown" })).toEqual(initialState);
    });
  });

  describe("synchronous actions", () => {
    it("should handle setFilters", () => {
      const filters: ReturnsFilters = {
        status: [FlipkartReturnStatus.APPROVED],
        searchQuery: "SKU123",
      };

      const state = flipkartReturnsReducer(
        { ...initialState, returns: [mockReturn] },
        setFilters(filters)
      );

      expect(state.filters).toEqual(filters);
    });

    it("should handle clearFilters", () => {
      const stateWithFilters = {
        ...initialState,
        filters: { status: [FlipkartReturnStatus.APPROVED] },
        returns: [mockReturn],
        filteredReturns: [],
      };

      const state = flipkartReturnsReducer(stateWithFilters, clearFilters());

      expect(state.filters).toEqual({});
      expect(state.filteredReturns).toEqual([mockReturn]);
    });

    it("should handle setSelectedReturn", () => {
      const state = flipkartReturnsReducer(initialState, setSelectedReturn(mockReturn));

      expect(state.selectedReturn).toEqual(mockReturn);
    });

    it("should handle clearError", () => {
      const stateWithError = {
        ...initialState,
        error: "Test error",
      };

      const state = flipkartReturnsReducer(stateWithError, clearError());

      expect(state.error).toBeNull();
    });

    it("should handle clearSuccessMessage", () => {
      const stateWithSuccess = {
        ...initialState,
        successMessage: "Test success",
      };

      const state = flipkartReturnsReducer(stateWithSuccess, clearSuccessMessage());

      expect(state.successMessage).toBeNull();
    });

    it("should handle resetUploadState", () => {
      const stateWithUpload = {
        ...initialState,
        uploading: true,
        uploadProgress: 50,
        error: "Upload error",
        successMessage: "Upload success",
      };

      const state = flipkartReturnsReducer(stateWithUpload, resetUploadState());

      expect(state.uploading).toBe(false);
      expect(state.uploadProgress).toBe(0);
      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });

  describe("async thunks", () => {
    describe("uploadReturnsFile", () => {
      it("should handle uploadReturnsFile.pending", () => {
        const action = { type: uploadReturnsFile.pending.type };
        const state = flipkartReturnsReducer(initialState, action);

        expect(state.uploading).toBe(true);
        expect(state.uploadProgress).toBe(0);
        expect(state.error).toBeNull();
        expect(state.successMessage).toBeNull();
      });

      it("should handle uploadReturnsFile.fulfilled with no duplicates", () => {
        const action = {
          type: uploadReturnsFile.fulfilled.type,
          payload: {
            returns: [mockReturn],
            duplicates: [],
            totalParsed: 1,
          },
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.uploading).toBe(false);
        expect(state.uploadProgress).toBe(100);
        expect(state.returns).toHaveLength(1);
        expect(state.successMessage).toBe("Successfully uploaded 1 returns.");
      });

      it("should handle uploadReturnsFile.fulfilled with duplicates", () => {
        const action = {
          type: uploadReturnsFile.fulfilled.type,
          payload: {
            returns: [mockReturn],
            duplicates: ["RET002"],
            totalParsed: 2,
          },
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.uploading).toBe(false);
        expect(state.uploadProgress).toBe(100);
        expect(state.returns).toHaveLength(1);
        expect(state.successMessage).toBe("Uploaded 1 returns. 1 duplicates skipped.");
      });

      it("should handle uploadReturnsFile.rejected", () => {
        const action = {
          type: uploadReturnsFile.rejected.type,
          payload: "Upload failed",
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.uploading).toBe(false);
        expect(state.uploadProgress).toBe(0);
        expect(state.error).toBe("Upload failed");
      });
    });

    describe("fetchReturns", () => {
      it("should handle fetchReturns.pending", () => {
        const action = { type: fetchReturns.pending.type };
        const state = flipkartReturnsReducer(initialState, action);

        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it("should handle fetchReturns.fulfilled", () => {
        const action = {
          type: fetchReturns.fulfilled.type,
          payload: [mockReturn],
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.loading).toBe(false);
        expect(state.returns).toHaveLength(1);
        expect(state.filteredReturns).toHaveLength(1);
      });

      it("should handle fetchReturns.rejected", () => {
        const action = {
          type: fetchReturns.rejected.type,
          payload: "Fetch failed",
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.loading).toBe(false);
        expect(state.error).toBe("Fetch failed");
      });
    });

    describe("fetchReturnsByDateRange", () => {
      it("should handle fetchReturnsByDateRange.fulfilled", () => {
        const action = {
          type: fetchReturnsByDateRange.fulfilled.type,
          payload: [mockReturn],
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.loading).toBe(false);
        expect(state.returns).toHaveLength(1);
      });
    });

    describe("fetchReturnsWithFilters", () => {
      it("should handle fetchReturnsWithFilters.fulfilled", () => {
        const action = {
          type: fetchReturnsWithFilters.fulfilled.type,
          payload: [mockReturn],
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.loading).toBe(false);
        expect(state.filteredReturns).toHaveLength(1);
      });
    });

    describe("fetchReturnById", () => {
      it("should handle fetchReturnById.fulfilled", () => {
        const action = {
          type: fetchReturnById.fulfilled.type,
          payload: mockReturn,
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.loading).toBe(false);
        expect(state.selectedReturn).toEqual(mockReturn);
      });
    });

    describe("updateReturnStatus", () => {
      it("should handle updateReturnStatus.fulfilled", () => {
        const stateWithReturns = {
          ...initialState,
          returns: [mockReturn],
          filteredReturns: [mockReturn],
          selectedReturn: mockReturn,
        };

        const action = {
          type: updateReturnStatus.fulfilled.type,
          payload: {
            returnId: "RET001",
            status: FlipkartReturnStatus.APPROVED,
          },
        };

        const state = flipkartReturnsReducer(stateWithReturns, action);

        expect(state.returns[0].returnStatus).toBe(FlipkartReturnStatus.APPROVED);
        expect(state.filteredReturns[0].returnStatus).toBe(FlipkartReturnStatus.APPROVED);
        expect(state.selectedReturn?.returnStatus).toBe(FlipkartReturnStatus.APPROVED);
        expect(state.successMessage).toBe("Return status updated successfully");
      });

      it("should handle updateReturnStatus.rejected", () => {
        const action = {
          type: updateReturnStatus.rejected.type,
          payload: "Update failed",
        };

        const state = flipkartReturnsReducer(initialState, action);

        expect(state.error).toBe("Update failed");
      });
    });

    describe("updateQCStatus", () => {
      it("should handle updateQCStatus.fulfilled with resaleable status", () => {
        const stateWithReturns = {
          ...initialState,
          returns: [mockReturn],
          filteredReturns: [mockReturn],
          selectedReturn: mockReturn,
        };

        const action = {
          type: updateQCStatus.fulfilled.type,
          payload: {
            returnId: "RET001",
            qcStatus: FlipkartQCStatus.RESALEABLE,
            resaleable: true,
          },
        };

        const state = flipkartReturnsReducer(stateWithReturns, action);

        expect(state.returns[0].qcStatus).toBe(FlipkartQCStatus.RESALEABLE);
        expect(state.returns[0].resaleable).toBe(true);
        expect(state.filteredReturns[0].qcStatus).toBe(FlipkartQCStatus.RESALEABLE);
        expect(state.filteredReturns[0].resaleable).toBe(true);
        expect(state.selectedReturn?.qcStatus).toBe(FlipkartQCStatus.RESALEABLE);
        expect(state.selectedReturn?.resaleable).toBe(true);
        expect(state.successMessage).toBe("QC status updated successfully");
      });

      it("should handle updateQCStatus.fulfilled with damaged status", () => {
        const stateWithReturns = {
          ...initialState,
          returns: [mockReturn],
          filteredReturns: [mockReturn],
          selectedReturn: mockReturn,
        };

        const action = {
          type: updateQCStatus.fulfilled.type,
          payload: {
            returnId: "RET001",
            qcStatus: FlipkartQCStatus.DAMAGED,
            resaleable: false,
          },
        };

        const state = flipkartReturnsReducer(stateWithReturns, action);

        expect(state.returns[0].qcStatus).toBe(FlipkartQCStatus.DAMAGED);
        expect(state.returns[0].resaleable).toBe(false);
      });
    });

    describe("deleteReturn", () => {
      it("should handle deleteReturn.fulfilled", () => {
        const stateWithReturns = {
          ...initialState,
          returns: [mockReturn, { ...mockReturn, returnId: "RET002" }],
          filteredReturns: [mockReturn, { ...mockReturn, returnId: "RET002" }],
          selectedReturn: mockReturn,
        };

        const action = {
          type: deleteReturn.fulfilled.type,
          payload: "RET001",
        };

        const state = flipkartReturnsReducer(stateWithReturns, action);

        expect(state.returns).toHaveLength(1);
        expect(state.returns[0].returnId).toBe("RET002");
        expect(state.filteredReturns).toHaveLength(1);
        expect(state.selectedReturn).toBeNull();
        expect(state.successMessage).toBe("Return deleted successfully");
      });
    });
  });

  describe("filters", () => {
    it("should apply status filter", () => {
      const returns = [
        mockReturn,
        { ...mockReturn, returnId: "RET002", returnStatus: FlipkartReturnStatus.APPROVED },
      ];

      const stateWithReturns = {
        ...initialState,
        returns,
      };

      const filters: ReturnsFilters = {
        status: [FlipkartReturnStatus.APPROVED],
      };

      const state = flipkartReturnsReducer(stateWithReturns, setFilters(filters));

      expect(state.filteredReturns).toHaveLength(1);
      expect(state.filteredReturns[0].returnStatus).toBe(FlipkartReturnStatus.APPROVED);
    });

    it("should apply search query filter", () => {
      const returns = [
        mockReturn,
        { ...mockReturn, returnId: "RET002", sku: "SKU456" },
      ];

      const stateWithReturns = {
        ...initialState,
        returns,
      };

      const filters: ReturnsFilters = {
        searchQuery: "SKU456",
      };

      const state = flipkartReturnsReducer(stateWithReturns, setFilters(filters));

      expect(state.filteredReturns).toHaveLength(1);
      expect(state.filteredReturns[0].sku).toBe("SKU456");
    });

    it("should apply resaleable only filter", () => {
      const returns = [
        mockReturn,
        { ...mockReturn, returnId: "RET002", resaleable: true },
      ];

      const stateWithReturns = {
        ...initialState,
        returns,
      };

      const filters: ReturnsFilters = {
        resaleableOnly: true,
      };

      const state = flipkartReturnsReducer(stateWithReturns, setFilters(filters));

      expect(state.filteredReturns).toHaveLength(1);
      expect(state.filteredReturns[0].resaleable).toBe(true);
    });

    it("should apply refund amount range filter", () => {
      const returns = [
        mockReturn,
        { ...mockReturn, returnId: "RET002", financials: { ...mockReturn.financials, refundAmount: 3000 } },
      ];

      const stateWithReturns = {
        ...initialState,
        returns,
      };

      const filters: ReturnsFilters = {
        minRefundAmount: 2000,
        maxRefundAmount: 4000,
      };

      const state = flipkartReturnsReducer(stateWithReturns, setFilters(filters));

      expect(state.filteredReturns).toHaveLength(1);
      expect(state.filteredReturns[0].financials.refundAmount).toBe(3000);
    });

    it("should apply multiple filters together", () => {
      const returns = [
        mockReturn,
        {
          ...mockReturn,
          returnId: "RET002",
          returnStatus: FlipkartReturnStatus.APPROVED,
          resaleable: true,
          financials: { ...mockReturn.financials, refundAmount: 2500 },
        },
      ];

      const stateWithReturns = {
        ...initialState,
        returns,
      };

      const filters: ReturnsFilters = {
        status: [FlipkartReturnStatus.APPROVED],
        resaleableOnly: true,
        minRefundAmount: 2000,
      };

      const state = flipkartReturnsReducer(stateWithReturns, setFilters(filters));

      expect(state.filteredReturns).toHaveLength(1);
      expect(state.filteredReturns[0].returnId).toBe("RET002");
    });
  });
});
