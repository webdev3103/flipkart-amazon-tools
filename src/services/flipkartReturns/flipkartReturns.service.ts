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
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase.config";
import {
  FlipkartReturn,
  FlipkartReturnStatus,
  FlipkartQCStatus,
  FlipkartReturnReasonCategory,
  ReturnsFilters,
} from "../../types/flipkartReturns.type";
import { Product } from "../../types/product";
import { Category } from "../../types/category";

const RETURNS_COLLECTION = "flipkartReturns";
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";

/**
 * FlipkartReturnsService
 *
 * Handles all Firebase Firestore operations for Flipkart returns.
 * Provides CRUD operations, querying, and analytics helpers.
 */
export class FlipkartReturnsService {
  /**
   * Enrich returns with product pricing data
   * Maps SKU to product selling price and cost price from products/categories
   */
  async enrichReturnsWithPricing(returns: FlipkartReturn[]): Promise<FlipkartReturn[]> {
    // Get unique SKUs
    const uniqueSkus = [...new Set(returns.map(r => r.sku))];

    // Batch fetch all products by SKU
    const productsMap = new Map<string, Product>();
    const categoriesMap = new Map<string, Category>();

    // Fetch products in batches (Firestore 'in' query supports max 30 items)
    const skuBatches: string[][] = [];
    for (let i = 0; i < uniqueSkus.length; i += 30) {
      skuBatches.push(uniqueSkus.slice(i, i + 30));
    }

    for (const skuBatch of skuBatches) {
      const productsQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where("sku", "in", skuBatch)
      );
      const productsSnapshot = await getDocs(productsQuery);
      productsSnapshot.forEach(doc => {
        const product = doc.data() as Product;
        productsMap.set(product.sku, product);
      });
    }

    // Get unique category IDs from products
    const categoryIds = [
      ...new Set(
        Array.from(productsMap.values())
          .map(p => p.categoryId)
          .filter((id): id is string => !!id)
      )
    ];

    // Fetch categories for cost price resolution
    if (categoryIds.length > 0) {
      const categoryBatches: string[][] = [];
      for (let i = 0; i < categoryIds.length; i += 30) {
        categoryBatches.push(categoryIds.slice(i, i + 30));
      }

      for (const categoryBatch of categoryBatches) {
        const categoriesQuery = query(
          collection(db, CATEGORIES_COLLECTION),
          where("__name__", "in", categoryBatch)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        categoriesSnapshot.forEach(doc => {
          categoriesMap.set(doc.id, doc.data() as Category);
        });
      }
    }

    // Enrich returns with pricing data
    return returns.map(returnItem => {
      const product = productsMap.get(returnItem.sku);

      if (!product) {
        return returnItem; // No product found, return unchanged
      }

      const sellingPrice = product.sellingPrice || 0;

      // Resolve cost price: product's category costPrice or 0
      let costPrice = 0;
      if (product.categoryId) {
        const category = categoriesMap.get(product.categoryId);
        costPrice = category?.costPrice || 0;
      }

      const profitMargin = sellingPrice - costPrice;

      return {
        ...returnItem,
        pricing: {
          sellingPrice,
          costPrice,
          profitMargin,
        },
      };
    });
  }

  /**
   * Save multiple returns to Firestore (batch operation)
   * Used after parsing Excel file
   */
  async saveReturns(returns: FlipkartReturn[]): Promise<void> {
    if (!returns || returns.length === 0) {
      throw new Error("No returns to save");
    }

    // Firestore batch limit is 500 operations
    const batchSize = 500;
    const batches: FlipkartReturn[][] = [];

    for (let i = 0; i < returns.length; i += batchSize) {
      batches.push(returns.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const writeBatchObj = writeBatch(db);

      batch.forEach((returnItem) => {
        const returnRef = doc(db, RETURNS_COLLECTION, returnItem.returnId);
        writeBatchObj.set(returnRef, this.serializeReturn(returnItem));
      });

      await writeBatchObj.commit();
    }
  }

  /**
   * Save a single return to Firestore
   */
  async saveReturn(returnItem: FlipkartReturn): Promise<void> {
    const returnRef = doc(db, RETURNS_COLLECTION, returnItem.returnId);
    await setDoc(returnRef, this.serializeReturn(returnItem));
  }

  /**
   * Get a single return by ID
   */
  async getReturnById(returnId: string): Promise<FlipkartReturn | null> {
    const returnRef = doc(db, RETURNS_COLLECTION, returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      return null;
    }

    return this.deserializeReturn(returnSnap.data());
  }

  /**
   * Get all returns
   */
  async getAllReturns(): Promise<FlipkartReturn[]> {
    const returnsRef = collection(db, RETURNS_COLLECTION);
    const q = query(returnsRef, orderBy("dates.returnInitiatedDate", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => this.deserializeReturn(doc.data()));
  }

  /**
   * Get returns by date range
   */
  async getReturnsByDateRange(startDate: Date, endDate: Date): Promise<FlipkartReturn[]> {
    const returnsRef = collection(db, RETURNS_COLLECTION);
    const q = query(
      returnsRef,
      where("dates.returnInitiatedDate", ">=", Timestamp.fromDate(startDate)),
      where("dates.returnInitiatedDate", "<=", Timestamp.fromDate(endDate)),
      orderBy("dates.returnInitiatedDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.deserializeReturn(doc.data()));
  }

  /**
   * Get returns by SKU
   */
  async getReturnsBySKU(sku: string): Promise<FlipkartReturn[]> {
    const returnsRef = collection(db, RETURNS_COLLECTION);
    const q = query(
      returnsRef,
      where("sku", "==", sku),
      orderBy("dates.returnInitiatedDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.deserializeReturn(doc.data()));
  }

  /**
   * Get returns by status
   */
  async getReturnsByStatus(status: FlipkartReturnStatus): Promise<FlipkartReturn[]> {
    const returnsRef = collection(db, RETURNS_COLLECTION);
    const q = query(
      returnsRef,
      where("returnStatus", "==", status),
      orderBy("dates.returnInitiatedDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.deserializeReturn(doc.data()));
  }

  /**
   * Get returns by return reason category
   */
  async getReturnsByReasonCategory(
    category: FlipkartReturnReasonCategory
  ): Promise<FlipkartReturn[]> {
    const returnsRef = collection(db, RETURNS_COLLECTION);
    const q = query(
      returnsRef,
      where("returnReasonCategory", "==", category),
      orderBy("dates.returnInitiatedDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.deserializeReturn(doc.data()));
  }

  /**
   * Get resaleable returns only
   */
  async getResaleableReturns(): Promise<FlipkartReturn[]> {
    const returnsRef = collection(db, RETURNS_COLLECTION);
    const q = query(
      returnsRef,
      where("resaleable", "==", true),
      orderBy("dates.returnInitiatedDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.deserializeReturn(doc.data()));
  }

  /**
   * Get returns with advanced filters
   */
  async getReturnsWithFilters(filters: ReturnsFilters): Promise<FlipkartReturn[]> {
    // For complex filters, we'll fetch all and filter in memory
    // This is acceptable for moderate data sizes; for large datasets, use Firestore indexes
    const allReturns = await this.getAllReturns();

    return allReturns.filter((returnItem) => {
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

      // Search query filter (Return ID, Order ID, SKU, Product Title)
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

  /**
   * Update return status
   */
  async updateReturnStatus(
    returnId: string,
    status: FlipkartReturnStatus
  ): Promise<void> {
    const returnRef = doc(db, RETURNS_COLLECTION, returnId);
    await updateDoc(returnRef, {
      returnStatus: status,
      "metadata.updatedAt": new Date().toISOString(),
    });
  }

  /**
   * Update QC status
   */
  async updateQCStatus(returnId: string, qcStatus: FlipkartQCStatus): Promise<void> {
    const returnRef = doc(db, RETURNS_COLLECTION, returnId);
    const resaleable = qcStatus === FlipkartQCStatus.RESALEABLE;

    await updateDoc(returnRef, {
      qcStatus,
      resaleable,
      "metadata.updatedAt": new Date().toISOString(),
    });
  }

  /**
   * Delete a return
   */
  async deleteReturn(returnId: string): Promise<void> {
    const returnRef = doc(db, RETURNS_COLLECTION, returnId);
    await deleteDoc(returnRef);
  }

  /**
   * Delete multiple returns (batch operation)
   */
  async deleteReturns(returnIds: string[]): Promise<void> {
    const batchSize = 500;
    const batches: string[][] = [];

    for (let i = 0; i < returnIds.length; i += batchSize) {
      batches.push(returnIds.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const writeBatchObj = writeBatch(db);

      batch.forEach((returnId) => {
        const returnRef = doc(db, RETURNS_COLLECTION, returnId);
        writeBatchObj.delete(returnRef);
      });

      await writeBatchObj.commit();
    }
  }

  /**
   * Check if return ID already exists
   */
  async returnExists(returnId: string): Promise<boolean> {
    const returnRef = doc(db, RETURNS_COLLECTION, returnId);
    const returnSnap = await getDoc(returnRef);
    return returnSnap.exists();
  }

  /**
   * Batch check which return IDs already exist
   * More efficient than calling returnExists() in a loop
   * Returns Set of returnIds that already exist in Firestore
   */
  async batchCheckExistingReturns(returnIds: string[]): Promise<Set<string>> {
    if (!returnIds || returnIds.length === 0) {
      return new Set();
    }

    console.log('[batchCheckExistingReturns] Checking', returnIds.length, 'return IDs');

    try {
      // Get all existing returns (we only need the IDs)
      // This is a single query vs N individual getDoc calls
      const returnsRef = collection(db, RETURNS_COLLECTION);
      const snapshot = await getDocs(returnsRef);

      const existingIds = new Set<string>();
      snapshot.forEach((doc) => {
        existingIds.add(doc.id);
      });

      console.log('[batchCheckExistingReturns] Found', existingIds.size, 'existing returns in database');

      // Filter to only the IDs we're checking
      const duplicates = new Set<string>();
      returnIds.forEach(id => {
        if (existingIds.has(id)) {
          duplicates.add(id);
        }
      });

      console.log('[batchCheckExistingReturns] Found', duplicates.size, 'duplicates');
      return duplicates;
    } catch (error) {
      // Handle permission errors gracefully
      // If we can't read existing returns, assume no duplicates exist
      // This allows first-time uploads to succeed
      console.warn('[batchCheckExistingReturns] Could not check for duplicates (permission error or empty collection):', error);
      console.log('[batchCheckExistingReturns] Proceeding without duplicate check - assuming all returns are new');
      return new Set();
    }
  }

  /**
   * Batch fetch existing returns by IDs
   * Returns a Map of returnId -> FlipkartReturn for existing returns
   */
  async batchFetchExistingReturns(returnIds: string[]): Promise<Map<string, FlipkartReturn>> {
    if (!returnIds || returnIds.length === 0) {
      return new Map();
    }

    console.log('[batchFetchExistingReturns] Fetching', returnIds.length, 'existing returns');

    try {
      const returnsRef = collection(db, RETURNS_COLLECTION);
      const snapshot = await getDocs(returnsRef);

      const existingReturns = new Map<string, FlipkartReturn>();
      snapshot.forEach((doc) => {
        if (returnIds.includes(doc.id)) {
          existingReturns.set(doc.id, this.deserializeReturn(doc.data()));
        }
      });

      console.log('[batchFetchExistingReturns] Found', existingReturns.size, 'existing returns');
      return existingReturns;
    } catch (error) {
      console.warn('[batchFetchExistingReturns] Could not fetch existing returns:', error);
      return new Map();
    }
  }

  /**
   * Update multiple returns (batch operation)
   * Merges new data with existing returns, preserving pricing enrichment
   */
  async updateReturns(returns: FlipkartReturn[]): Promise<void> {
    if (!returns || returns.length === 0) {
      throw new Error("No returns to update");
    }

    console.log('[updateReturns] Updating', returns.length, 'returns');

    // Firestore batch limit is 500 operations
    const batchSize = 500;
    const batches: FlipkartReturn[][] = [];

    for (let i = 0; i < returns.length; i += batchSize) {
      batches.push(returns.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const writeBatchObj = writeBatch(db);

      batch.forEach((returnItem) => {
        const returnRef = doc(db, RETURNS_COLLECTION, returnItem.returnId);
        writeBatchObj.set(returnRef, this.serializeReturn(returnItem), { merge: true });
      });

      await writeBatchObj.commit();
    }

    console.log('[updateReturns] Successfully updated', returns.length, 'returns');
  }

  /**
   * Get returns grouped by reason category
   */
  async getReturnsGroupedByReason(): Promise<Map<FlipkartReturnReasonCategory, number>> {
    const allReturns = await this.getAllReturns();
    const grouped = new Map<FlipkartReturnReasonCategory, number>();

    allReturns.forEach((returnItem) => {
      const current = grouped.get(returnItem.returnReasonCategory) || 0;
      grouped.set(returnItem.returnReasonCategory, current + 1);
    });

    return grouped;
  }

  /**
   * Get returns grouped by SKU
   */
  async getReturnsGroupedBySKU(): Promise<Map<string, FlipkartReturn[]>> {
    const allReturns = await this.getAllReturns();
    const grouped = new Map<string, FlipkartReturn[]>();

    allReturns.forEach((returnItem) => {
      const current = grouped.get(returnItem.sku) || [];
      current.push(returnItem);
      grouped.set(returnItem.sku, current);
    });

    return grouped;
  }

  /**
   * Get total return value (sum of all refund amounts)
   */
  async getTotalReturnValue(): Promise<number> {
    const allReturns = await this.getAllReturns();
    return allReturns.reduce((sum, returnItem) => sum + returnItem.financials.refundAmount, 0);
  }

  /**
   * Get total net loss from returns
   */
  async getTotalNetLoss(): Promise<number> {
    const allReturns = await this.getAllReturns();
    return allReturns.reduce((sum, returnItem) => sum + returnItem.financials.netLoss, 0);
  }

  /**
   * Get returns count
   */
  async getReturnsCount(): Promise<number> {
    const allReturns = await this.getAllReturns();
    return allReturns.length;
  }

  /**
   * Serialize FlipkartReturn for Firestore storage
   * Converts Date objects to Timestamps and removes undefined values
   */
  private serializeReturn(returnItem: FlipkartReturn): DocumentData {
    const serialized: DocumentData = {
      ...returnItem,
      dates: {
        orderDate: Timestamp.fromDate(returnItem.dates.orderDate),
        returnInitiatedDate: Timestamp.fromDate(returnItem.dates.returnInitiatedDate),
        returnApprovedDate: returnItem.dates.returnApprovedDate
          ? Timestamp.fromDate(returnItem.dates.returnApprovedDate)
          : null,
        pickupDate: returnItem.dates.pickupDate
          ? Timestamp.fromDate(returnItem.dates.pickupDate)
          : null,
        returnDeliveredDate: returnItem.dates.returnDeliveredDate
          ? Timestamp.fromDate(returnItem.dates.returnDeliveredDate)
          : null,
        refundProcessedDate: returnItem.dates.refundProcessedDate
          ? Timestamp.fromDate(returnItem.dates.refundProcessedDate)
          : null,
      },
    };

    // Remove all undefined values recursively (Firestore doesn't allow undefined)
    return this.removeUndefinedValues(serialized) as DocumentData;
  }

  /**
   * Recursively remove undefined values from an object
   * Firestore rejects documents with undefined values
   */
  private removeUndefinedValues(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }

    // Check if it's a Firestore Timestamp (has toDate and toMillis methods)
    const isTimestamp = obj && typeof obj === 'object' &&
      'toDate' in obj && 'toMillis' in obj;

    if (typeof obj === 'object' && !isTimestamp) {
      const cleaned: Record<string, unknown> = {};
      Object.keys(obj).forEach(key => {
        const value = (obj as Record<string, unknown>)[key];
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value);
        }
      });
      return cleaned;
    }

    return obj;
  }

  /**
   * Deserialize Firestore data to FlipkartReturn
   * Converts Timestamps to Date objects
   */
  private deserializeReturn(data: DocumentData): FlipkartReturn {
    return {
      ...data,
      dates: {
        orderDate: data.dates.orderDate.toDate(),
        returnInitiatedDate: data.dates.returnInitiatedDate.toDate(),
        returnApprovedDate: data.dates.returnApprovedDate
          ? data.dates.returnApprovedDate.toDate()
          : undefined,
        pickupDate: data.dates.pickupDate ? data.dates.pickupDate.toDate() : undefined,
        returnDeliveredDate: data.dates.returnDeliveredDate
          ? data.dates.returnDeliveredDate.toDate()
          : undefined,
        refundProcessedDate: data.dates.refundProcessedDate
          ? data.dates.refundProcessedDate.toDate()
          : undefined,
      },
    } as FlipkartReturn;
  }
}

// Export singleton instance
export const flipkartReturnsService = new FlipkartReturnsService();
