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
      console.log('[uploadReturnsFile] Starting upload process for:', file.name);

      // Parse Excel file
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();
      console.log('[uploadReturnsFile] Parsed returns:', returns.length);

      if (!returns || returns.length === 0) {
        throw new Error("No valid returns found in file");
      }

      // Check for duplicates using batch method (much faster than individual checks)
      console.log('[uploadReturnsFile] Checking for duplicates...');
      const returnIds = returns.map(r => r.returnId);
      const duplicateSet = await flipkartReturnsService.batchCheckExistingReturns(returnIds);
      const duplicates = Array.from(duplicateSet);
      console.log('[uploadReturnsFile] Found duplicates:', duplicates.length);

      // Save non-duplicate returns
      const newReturns = returns.filter((r) => !duplicates.includes(r.returnId));
      console.log('[uploadReturnsFile] Saving new returns:', newReturns.length);

      if (newReturns.length > 0) {
        await flipkartReturnsService.saveReturns(newReturns);
        console.log('[uploadReturnsFile] Returns saved successfully');
      }

      // Restore inventory for resaleable returns
      let inventoryRestoration: InventoryRestorationResult | null = null;
      if (newReturns.length > 0) {
        const state = getState() as { auth: { user: { uid: string } | null } };
        const userId = state.auth?.user?.uid || 'system';
        console.log('[uploadReturnsFile] Restoring inventory for user:', userId);

        const integrationService = new ReturnsInventoryIntegrationService();
        inventoryRestoration = await integrationService.restoreInventoryFromReturns(
          newReturns,
          userId
        );
        console.log('[uploadReturnsFile] Inventory restoration result:', inventoryRestoration);
      }

      console.log('[uploadReturnsFile] Upload process completed successfully');
      return {
        returns: newReturns,
        duplicates,
        totalParsed: returns.length,
        inventoryRestoration,
      };
    } catch (error) {
      console.error('[uploadReturnsFile] Error during upload:', error);
      if (error instanceof Error) {
        console.error('[uploadReturnsFile] Error message:', error.message);
        console.error('[uploadReturnsFile] Error stack:', error.stack);
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
      state.returns = [...state.returns, ...action.payload.returns];
      state.filteredReturns = applyFilters(state.returns, state.filters);
      state.inventoryRestoration = action.payload.inventoryRestoration;

      const { duplicates, inventoryRestoration } = action.payload;
      const savedCount = action.payload.returns.length;

      // Build success message with inventory restoration info
      let message = `Successfully uploaded ${savedCount} returns.`;

      if (duplicates.length > 0) {
        message = `Uploaded ${savedCount} returns. ${duplicates.length} duplicates skipped.`;
      }

      if (inventoryRestoration && inventoryRestoration.restored.length > 0) {
        message += ` ${inventoryRestoration.restored.length} resaleable items restored to inventory.`;
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
    if (filters.dateRange) {
      const returnDate = returnItem.dates.returnInitiatedDate;
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
