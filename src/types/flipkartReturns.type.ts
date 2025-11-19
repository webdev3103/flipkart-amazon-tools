/**
 * Flipkart Returns Data Types
 *
 * This file defines all types, interfaces, and enums for Flipkart returns processing.
 * It includes raw data structures from Flipkart Excel reports and normalized internal types.
 */

/**
 * Raw data structure from Flipkart Returns Report Excel (snake_case format)
 * This matches the actual columns in Flipkart's native returns report export
 */
export interface FlipkartReturnsDataNative {
  return_id: string;
  order_item_id: string;
  fulfilment_type?: string;
  return_requested_date: string;
  return_approval_date?: string;
  return_status: string;
  return_reason: string;
  return_sub_reason?: string;
  return_type: string;
  return_result?: string;
  return_expectation?: string;
  reverse_logistics_tracking_id?: string;
  sku: string;
  fsn: string;
  product_title: string;
  quantity: number | string;
  return_completion_type?: string;
  primary_pv_output?: string;
  detailed_pv_output?: string;
  final_condition_of_returned_product?: string;
  tech_visit_sla?: string;
  tech_visit_by_date?: string;
  tech_visit_completion_datetime?: string;
  tech_visit_completion_breach?: string;
  return_completion_sla?: string;
  return_complete_by_date?: string;
  return_completion_date?: string;
  return_completion_breach?: string;
  return_cancellation_date?: string;
  return_cancellation_reason?: string;
}

/**
 * Raw data structure from Flipkart Returns Report Excel (Title Case format - legacy)
 * This matches the expected columns in Flipkart's returns report export
 */
export interface FlipkartReturnsData {
  "Return ID": string;
  "Order ID": string;
  "Order Date": string;
  "SKU": string;
  "FSN": string;
  "Product Title": string;
  "Quantity": number;
  "Return Reason": string;
  "Return Type": string;
  "Return Status": string;
  "Return Initiated Date": string;
  "Return Approved Date"?: string;
  "Pickup Date"?: string;
  "Return Delivered Date"?: string;
  "Refund Processed Date"?: string;
  "Refund Amount (INR)": string;
  "Reverse Pickup Charges (INR)": string;
  "Commission Reversal (INR)": string;
  "Settlement Amount (INR)": string;
  "Return Location"?: string;
  "Warehouse Location"?: string;
  "QC Status"?: string;
  "Restocking Fee (INR)"?: string;
}

/**
 * Normalized Flipkart return record for internal use
 * This is the structure stored in Firebase and used throughout the application
 */
export interface FlipkartReturn {
  returnId: string;
  orderId: string;
  platform: 'flipkart';
  sku: string;
  fsn: string;
  productTitle: string;
  quantity: number;
  returnReason: string;
  returnReasonCategory: FlipkartReturnReasonCategory;
  returnType: FlipkartReturnType;
  returnStatus: FlipkartReturnStatus;
  dates: {
    orderDate: Date;
    returnInitiatedDate: Date;
    returnApprovedDate?: Date;
    pickupDate?: Date;
    returnDeliveredDate?: Date;
    refundProcessedDate?: Date;
  };
  financials: {
    refundAmount: number;
    reversePickupCharges: number;
    commissionReversal: number;
    settlementAmount: number;
    restockingFee: number;
    netLoss: number; // Calculated: refundAmount + reversePickupCharges - commissionReversal + restockingFee
  };
  location?: {
    returnLocation?: string;
    warehouseLocation?: string;
  };
  qcStatus?: FlipkartQCStatus;
  resaleable: boolean; // Derived from QC status
  categoryId?: string; // Linked from products collection
  metadata: {
    createdAt: string;
    updatedAt: string;
    importedAt: string;
  };
}

/**
 * Categorized return reasons for analytics
 * Maps raw return reason text to standardized categories
 */
export enum FlipkartReturnReasonCategory {
  DEFECTIVE = 'Defective',
  QUALITY_ISSUE = 'Quality Issue',
  WRONG_ITEM = 'Wrong Item Sent',
  DAMAGED = 'Damaged in Transit',
  NOT_AS_DESCRIBED = 'Not As Described',
  SIZE_COLOR_ISSUE = 'Size/Color Issue',
  CUSTOMER_CHANGED_MIND = 'Customer Changed Mind',
  DUPLICATE_ORDER = 'Duplicate Order',
  LATE_DELIVERY = 'Late Delivery',
  BETTER_PRICE = 'Found Better Price',
  OTHER = 'Other'
}

/**
 * Types of returns in Flipkart ecosystem
 */
export enum FlipkartReturnType {
  CUSTOMER_RETURN = 'Customer Return',
  SELLER_RETURN = 'Seller Return',
  QUALITY_ISSUE = 'Quality Issue',
  RTO = 'RTO' // Return to Origin (undelivered)
}

/**
 * Return processing status lifecycle
 */
export enum FlipkartReturnStatus {
  INITIATED = 'Initiated',
  APPROVED = 'Approved',
  PICKUP_SCHEDULED = 'Pickup Scheduled',
  PICKED_UP = 'Picked Up',
  IN_TRANSIT = 'In Transit',
  DELIVERED_TO_WAREHOUSE = 'Delivered to Warehouse',
  QC_PENDING = 'QC Pending',
  QC_COMPLETED = 'QC Completed',
  REFUNDED = 'Refunded',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled'
}

/**
 * Quality check status for returned items
 */
export enum FlipkartQCStatus {
  RESALEABLE = 'Resaleable',
  DAMAGED = 'Damaged',
  DEFECTIVE = 'Defective',
  MISSING_PARTS = 'Missing Parts',
  UNSEALED = 'Unsealed',
  NOT_RECEIVED = 'Not Received',
  PENDING = 'Pending' // QC not yet performed
}

/**
 * Note attached to a return for case management
 */
export interface ReturnNote {
  noteId: string;
  returnId: string;
  author: string; // User ID or email
  note: string;
  timestamp: Date;
  attachments?: string[]; // Firebase Storage URLs for photos
}

/**
 * Returns analytics aggregation
 */
export interface ReturnsAnalytics {
  totalReturns: number;
  totalRefunded: number;
  totalNetLoss: number;
  returnRate: number; // Percentage
  byReason: Map<FlipkartReturnReasonCategory, number>;
  bySKU: Map<string, number>;
  byStatus: Map<FlipkartReturnStatus, number>;
  topReturnedProducts: Array<{
    sku: string;
    productTitle: string;
    returnCount: number;
    returnRate: number;
    totalRefunds: number;
  }>;
}

/**
 * Product return risk assessment
 */
export interface ReturnRiskProduct {
  sku: string;
  productName: string;
  returnRate: number;
  returnCount: number;
  totalOrders: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  topReturnReason: FlipkartReturnReasonCategory;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Date range filter for returns queries
 */
export interface ReturnsDateRange {
  start: Date;
  end: Date;
}

/**
 * Comprehensive filter options for returns list
 */
export interface ReturnsFilters {
  dateRange?: ReturnsDateRange;
  status?: FlipkartReturnStatus[];
  returnType?: FlipkartReturnType[];
  returnReasonCategory?: FlipkartReturnReasonCategory[];
  qcStatus?: FlipkartQCStatus[];
  searchQuery?: string; // Search by Return ID, Order ID, SKU, or Product Title
  minRefundAmount?: number;
  maxRefundAmount?: number;
  resaleableOnly?: boolean;
}

/**
 * Returns upload validation result
 */
export interface ReturnsValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates: string[]; // Return IDs that already exist
  totalRecords: number;
  validRecords: number;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  value: string;
  message: string;
}
