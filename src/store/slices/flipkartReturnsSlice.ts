import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  FlipkartReturn,
  FlipkartReturnStatus,
  FlipkartQCStatus,
  ReturnsFilters,
} from "../../types/flipkartReturns.type";
import { flipkartReturnsService } from "../../services/flipkartReturns/flipkartReturns.service";
import { FlipkartReturnsFactory } from "../../services/flipkartReturns/FlipkartReturnsFactory";
import { ReturnsInventoryIntegrationService, InventoryRestorationResult } from "../../services/flipkartReturns/ReturnsInventoryIntegration.service";

/**
 * State interface for Flipkart Returns
 */
interface FlipkartReturnsState {
  returns: FlipkartReturn[];
  filteredReturns: FlipkartReturn[];
  selectedReturn: FlipkartReturn | null;
  filters: ReturnsFilters;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  successMessage: string | null;
  inventoryRestoration: InventoryRestorationResult | null;
}

/**
 * Initial state
 */
const initialState: FlipkartReturnsState = {
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

/**
 * Async thunk: Upload and process returns Excel file with inventory restoration
 */
export const uploadReturnsFile = createAsyncThunk(
  "flipkartReturns/uploadFile",
  async (file: File, { rejectWithValue, getState }) => {
    try {
      // Parse Excel file
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      if (!returns || returns.length === 0) {
        throw new Error("No valid returns found in file");
      }

      // Check for duplicates using batch method (much faster than individual checks)
      const returnIds = returns.map(r => r.returnId);
      const duplicateSet = await flipkartReturnsService.batchCheckExistingReturns(returnIds);
      const duplicateIds = Array.from(duplicateSet);

      // Separate new returns and duplicate returns
      const newReturns = returns.filter((r) => !duplicateIds.includes(r.returnId));
      const duplicateReturns = returns.filter((r) => duplicateIds.includes(r.returnId));

      // Fetch existing returns to merge with updates
      let updatedReturns: FlipkartReturn[] = [];
      const skippedDeliveredReturns: FlipkartReturn[] = [];

      if (duplicateReturns.length > 0) {
        const existingReturnsMap = await flipkartReturnsService.batchFetchExistingReturns(duplicateIds);

        // Filter out returns that are already delivered - they should not be updated
        const returnsToUpdate: FlipkartReturn[] = [];

        duplicateReturns.forEach((newReturn) => {
          const existingReturn = existingReturnsMap.get(newReturn.returnId);

          if (!existingReturn) {
            returnsToUpdate.push(newReturn); // Shouldn't happen, but handle gracefully
            return;
          }

          // Skip update if return is already marked as delivered
          if (existingReturn.dates.returnDeliveredDate) {
            skippedDeliveredReturns.push(existingReturn);
            return;
          }

          // Merge: Use new data for all fields, but preserve existing pricing if new data doesn't have it
          returnsToUpdate.push({
            ...newReturn,
            pricing: newReturn.pricing || existingReturn.pricing,
            categoryId: newReturn.categoryId || existingReturn.categoryId,
            metadata: {
              ...newReturn.metadata,
              createdAt: existingReturn.metadata.createdAt, // Preserve original creation time
            },
          });
        });

        // Enrich and update only non-delivered returns
        if (returnsToUpdate.length > 0) {
          updatedReturns = await flipkartReturnsService.enrichReturnsWithPricing(returnsToUpdate);
          await flipkartReturnsService.updateReturns(updatedReturns);
        }
      }

      // Enrich and save new returns with product pricing data
      let enrichedNewReturns: FlipkartReturn[] = [];
      if (newReturns.length > 0) {
        enrichedNewReturns = await flipkartReturnsService.enrichReturnsWithPricing(newReturns);
        await flipkartReturnsService.saveReturns(enrichedNewReturns);
      }

      // Restore inventory for delivered returns
      // Logic: When a return is delivered (returnDeliveredDate set), restore to inventory
      // This applies to both new returns AND updated returns with newly added delivery dates
      let inventoryRestoration: InventoryRestorationResult | null = null;
      const allReturnsToProcess = [...enrichedNewReturns, ...updatedReturns];

      if (allReturnsToProcess.length > 0) {
        const state = getState() as { auth: { user: { uid: string } | null } };
        const userId = state.auth?.user?.uid || 'system';

        const integrationService = new ReturnsInventoryIntegrationService();

        // Restore inventory for delivered returns (primary trigger)
        inventoryRestoration = await integrationService.restoreInventoryFromDeliveredReturns(
          allReturnsToProcess,
          userId
        );
      }

      return {
        newReturns: enrichedNewReturns,
        updatedReturns,
        skippedDeliveredReturns, // Returns already marked as delivered (not updated)
        totalParsed: returns.length,
        inventoryRestoration,
      };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to upload returns file");
    }
  }
);

/**
 * Async thunk: Fetch all returns
 */
export const fetchReturns = createAsyncThunk(
  "flipkartReturns/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const returns = await flipkartReturnsService.getAllReturns();
      return returns;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch returns");
    }
  }
);

/**
 * Async thunk: Fetch returns by date range
 */
export const fetchReturnsByDateRange = createAsyncThunk(
  "flipkartReturns/fetchByDateRange",
  async ({ startDate, endDate }: { startDate: Date; endDate: Date }, { rejectWithValue }) => {
    try {
      const returns = await flipkartReturnsService.getReturnsByDateRange(startDate, endDate);
      return returns;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch returns by date range");
    }
  }
);

/**
 * Async thunk: Fetch returns with filters
 */
export const fetchReturnsWithFilters = createAsyncThunk(
  "flipkartReturns/fetchWithFilters",
  async (filters: ReturnsFilters, { rejectWithValue }) => {
    try {
      const returns = await flipkartReturnsService.getReturnsWithFilters(filters);
      return returns;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch filtered returns");
    }
  }
);

/**
 * Async thunk: Fetch single return by ID
 */
export const fetchReturnById = createAsyncThunk(
  "flipkartReturns/fetchById",
  async (returnId: string, { rejectWithValue }) => {
    try {
      const returnItem = await flipkartReturnsService.getReturnById(returnId);
      if (!returnItem) {
        throw new Error("Return not found");
      }
      return returnItem;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch return");
    }
  }
);

/**
 * Async thunk: Update return status
 */
export const updateReturnStatus = createAsyncThunk(
  "flipkartReturns/updateStatus",
  async (
    { returnId, status }: { returnId: string; status: FlipkartReturnStatus },
    { rejectWithValue }
  ) => {
    try {
      await flipkartReturnsService.updateReturnStatus(returnId, status);
      return { returnId, status };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update return status");
    }
  }
);

/**
 * Async thunk: Update QC status
 */
export const updateQCStatus = createAsyncThunk(
  "flipkartReturns/updateQCStatus",
  async (
    { returnId, qcStatus }: { returnId: string; qcStatus: FlipkartQCStatus },
    { rejectWithValue }
  ) => {
    try {
      await flipkartReturnsService.updateQCStatus(returnId, qcStatus);
      const resaleable = qcStatus === FlipkartQCStatus.RESALEABLE;
      return { returnId, qcStatus, resaleable };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update QC status");
    }
  }
);

/**
 * Async thunk: Delete return
 */
export const deleteReturn = createAsyncThunk(
  "flipkartReturns/delete",
  async (returnId: string, { rejectWithValue }) => {
    try {
      await flipkartReturnsService.deleteReturn(returnId);
      return returnId;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete return");
    }
  }
);

/**
 * Flipkart Returns Slice
 */
const flipkartReturnsSlice = createSlice({
  name: "flipkartReturns",
  initialState,
  reducers: {
    /**
     * Set filters
     */
    setFilters: (state, action: PayloadAction<ReturnsFilters>) => {
      state.filters = action.payload;
      state.filteredReturns = applyFilters(state.returns, action.payload);
    },

    /**
     * Clear filters
     */
    clearFilters: (state) => {
      state.filters = {};
      state.filteredReturns = state.returns;
    },

    /**
     * Set selected return
     */
    setSelectedReturn: (state, action: PayloadAction<FlipkartReturn | null>) => {
      state.selectedReturn = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear success message
     */
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    /**
     * Reset upload state
     */
    resetUploadState: (state) => {
      state.uploading = false;
      state.uploadProgress = 0;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Upload returns file
    builder.addCase(uploadReturnsFile.pending, (state) => {
      state.uploading = true;
      state.uploadProgress = 0;
      state.error = null;
      state.successMessage = null;
    });
    builder.addCase(uploadReturnsFile.fulfilled, (state, action) => {
      state.uploading = false;
      state.uploadProgress = 100;

      const { newReturns, updatedReturns, skippedDeliveredReturns = [], inventoryRestoration } = action.payload;

      // Add new returns to the state
      state.returns = [...state.returns, ...newReturns];

      // Update existing returns in the state
      if (updatedReturns.length > 0) {
        updatedReturns.forEach((updatedReturn) => {
          const index = state.returns.findIndex((r) => r.returnId === updatedReturn.returnId);
          if (index !== -1) {
            state.returns[index] = updatedReturn;
          }
        });
      }

      state.filteredReturns = applyFilters(state.returns, state.filters);
      state.inventoryRestoration = inventoryRestoration;

      // Build success message
      const newCount = newReturns.length;
      const updatedCount = updatedReturns.length;
      const skippedCount = skippedDeliveredReturns?.length || 0;
      const totalCount = newCount + updatedCount;

      let message = '';

      if (newCount > 0 && updatedCount > 0) {
        message = `Successfully processed ${totalCount} returns: ${newCount} new, ${updatedCount} updated.`;
      } else if (newCount > 0) {
        message = `Successfully uploaded ${newCount} new returns.`;
      } else if (updatedCount > 0) {
        message = `Successfully updated ${updatedCount} existing returns.`;
      } else {
        message = 'No returns to process.';
      }

      if (skippedCount > 0) {
        message += ` ${skippedCount} delivered returns skipped (already completed).`;
      }

      if (inventoryRestoration && inventoryRestoration.restored.length > 0) {
        message += ` ${inventoryRestoration.restored.length} items restored to inventory.`;
      }

      if (inventoryRestoration && inventoryRestoration.errors.length > 0) {
        message += ` Warning: ${inventoryRestoration.errors.length} items failed inventory restoration.`;
      }

      state.successMessage = message;
    });
    builder.addCase(uploadReturnsFile.rejected, (state, action) => {
      state.uploading = false;
      state.uploadProgress = 0;
      state.error = action.payload as string;
    });

    // Fetch all returns
    builder.addCase(fetchReturns.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReturns.fulfilled, (state, action) => {
      state.loading = false;
      state.returns = action.payload;
      state.filteredReturns = applyFilters(action.payload, state.filters);
    });
    builder.addCase(fetchReturns.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch returns by date range
    builder.addCase(fetchReturnsByDateRange.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReturnsByDateRange.fulfilled, (state, action) => {
      state.loading = false;
      state.returns = action.payload;
      state.filteredReturns = applyFilters(action.payload, state.filters);
    });
    builder.addCase(fetchReturnsByDateRange.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch returns with filters
    builder.addCase(fetchReturnsWithFilters.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReturnsWithFilters.fulfilled, (state, action) => {
      state.loading = false;
      state.filteredReturns = action.payload;
    });
    builder.addCase(fetchReturnsWithFilters.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch return by ID
    builder.addCase(fetchReturnById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReturnById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedReturn = action.payload;
    });
    builder.addCase(fetchReturnById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update return status
    builder.addCase(updateReturnStatus.fulfilled, (state, action) => {
      const { returnId, status } = action.payload;

      // Update in returns array
      const index = state.returns.findIndex((r) => r.returnId === returnId);
      if (index !== -1) {
        state.returns[index].returnStatus = status;
      }

      // Update in filtered returns
      const filteredIndex = state.filteredReturns.findIndex((r) => r.returnId === returnId);
      if (filteredIndex !== -1) {
        state.filteredReturns[filteredIndex].returnStatus = status;
      }

      // Update selected return
      if (state.selectedReturn?.returnId === returnId) {
        state.selectedReturn.returnStatus = status;
      }

      state.successMessage = "Return status updated successfully";
    });
    builder.addCase(updateReturnStatus.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Update QC status
    builder.addCase(updateQCStatus.fulfilled, (state, action) => {
      const { returnId, qcStatus, resaleable } = action.payload;

      // Update in returns array
      const index = state.returns.findIndex((r) => r.returnId === returnId);
      if (index !== -1) {
        state.returns[index].qcStatus = qcStatus;
        state.returns[index].resaleable = resaleable;
      }

      // Update in filtered returns
      const filteredIndex = state.filteredReturns.findIndex((r) => r.returnId === returnId);
      if (filteredIndex !== -1) {
        state.filteredReturns[filteredIndex].qcStatus = qcStatus;
        state.filteredReturns[filteredIndex].resaleable = resaleable;
      }

      // Update selected return
      if (state.selectedReturn?.returnId === returnId) {
        state.selectedReturn.qcStatus = qcStatus;
        state.selectedReturn.resaleable = resaleable;
      }

      state.successMessage = "QC status updated successfully";
    });
    builder.addCase(updateQCStatus.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Delete return
    builder.addCase(deleteReturn.fulfilled, (state, action) => {
      const returnId = action.payload;
      state.returns = state.returns.filter((r) => r.returnId !== returnId);
      state.filteredReturns = state.filteredReturns.filter((r) => r.returnId !== returnId);

      if (state.selectedReturn?.returnId === returnId) {
        state.selectedReturn = null;
      }

      state.successMessage = "Return deleted successfully";
    });
    builder.addCase(deleteReturn.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

/**
 * Helper function to apply filters to returns array
 */
function applyFilters(returns: FlipkartReturn[], filters: ReturnsFilters): FlipkartReturn[] {
  if (!filters || Object.keys(filters).length === 0) {
    return returns;
  }

  return returns.filter((returnItem) => {
    // Date range filter
    // Priority: returnDeliveredDate (completion) > returnApprovedDate > returnInitiatedDate
    if (filters.dateRange) {
      const returnDate = returnItem.dates.returnDeliveredDate
        || returnItem.dates.returnApprovedDate
        || returnItem.dates.returnInitiatedDate;

      if (
        returnDate < filters.dateRange.start ||
        returnDate > filters.dateRange.end
      ) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(returnItem.returnStatus)) {
        return false;
      }
    }

    // Return type filter
    if (filters.returnType && filters.returnType.length > 0) {
      if (!filters.returnType.includes(returnItem.returnType)) {
        return false;
      }
    }

    // Return reason category filter
    if (filters.returnReasonCategory && filters.returnReasonCategory.length > 0) {
      if (!filters.returnReasonCategory.includes(returnItem.returnReasonCategory)) {
        return false;
      }
    }

    // QC status filter
    if (filters.qcStatus && filters.qcStatus.length > 0) {
      if (!returnItem.qcStatus || !filters.qcStatus.includes(returnItem.qcStatus)) {
        return false;
      }
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        returnItem.returnId.toLowerCase().includes(query) ||
        returnItem.orderId.toLowerCase().includes(query) ||
        returnItem.sku.toLowerCase().includes(query) ||
        returnItem.productTitle.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }
    }

    // Refund amount range filter
    if (filters.minRefundAmount !== undefined) {
      if (returnItem.financials.refundAmount < filters.minRefundAmount) {
        return false;
      }
    }
    if (filters.maxRefundAmount !== undefined) {
      if (returnItem.financials.refundAmount > filters.maxRefundAmount) {
        return false;
      }
    }

    // Resaleable only filter
    if (filters.resaleableOnly === true) {
      if (!returnItem.resaleable) {
        return false;
      }
    }

    return true;
  });
}

// Export actions
export const {
  setFilters,
  clearFilters,
  setSelectedReturn,
  clearError,
  clearSuccessMessage,
  resetUploadState,
} = flipkartReturnsSlice.actions;

// Export reducer
export default flipkartReturnsSlice.reducer;
