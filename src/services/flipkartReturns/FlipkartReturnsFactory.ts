import * as XLSX from "xlsx";
import {
  FlipkartReturn,
  FlipkartReturnsData,
  FlipkartReturnsDataNative,
  FlipkartReturnReasonCategory,
  FlipkartReturnType,
  FlipkartReturnStatus,
  FlipkartQCStatus,
} from "../../types/flipkartReturns.type";

/**
 * FlipkartReturnsFactory
 *
 * Processes Flipkart returns Excel files and transforms raw data into normalized FlipkartReturn objects.
 * Follows the same pattern as FlipkartFactory for order processing.
 *
 * Expected Excel structure:
 * - Sheet name: "Returns" or "Returns Report" or "Return Report"
 * - First row contains column headers matching FlipkartReturnsData interface
 */
export class FlipkartReturnsFactory {
  private file: File;
  private workbook: XLSX.WorkBook | undefined;
  private returnsData: FlipkartReturnsData[] = [];
  public returns: FlipkartReturn[] = [];
  private categoryMapping: Map<string, string> = new Map();
  private isNativeFormat: boolean = false; // Track if using Flipkart's native snake_case format

  constructor(file: File) {
    this.file = file;
  }

  /**
   * Main processing pipeline
   * Reads Excel file, parses returns sheet, transforms data
   */
  public async process(): Promise<FlipkartReturn[]> {
    await this.readWorkbook();
    this.parseReturnsSheet();
    this.transformReturnsData();
    return this.returns;
  }

  /**
   * Read and parse Excel workbook
   */
  private async readWorkbook(): Promise<void> {
    try {
      const buffer = await this.file.arrayBuffer();
      this.workbook = XLSX.read(buffer, { type: "array" });

      // Look for returns sheet with various possible names
      const possibleSheetNames = ["Returns", "Returns Report", "Return Report", "Returns_Report"];
      const returnsSheet = possibleSheetNames.find((name) =>
        this.workbook?.SheetNames.includes(name)
      );

      if (!returnsSheet) {
        throw new Error(
          `Required sheet not found. Expected one of: ${possibleSheetNames.join(", ")}`
        );
      }

      const sheet = this.workbook.Sheets[returnsSheet];

      // Just validate that sheet exists and has some cells
      // Actual parsing will be done in parseReturnsSheet()
      console.log('[FlipkartReturnsFactory] readWorkbook diagnostics:');
      console.log('  - Total sheets found:', this.workbook.SheetNames.length);
      console.log('  - Sheet names:', this.workbook.SheetNames);
      console.log('  - Selected sheet:', returnsSheet);
      console.log('  - Sheet has range:', sheet['!ref']);

      if (!sheet || !sheet['!ref']) {
        throw new Error(
          `Returns sheet "${returnsSheet}" is empty or invalid. ` +
          `Found ${this.workbook.SheetNames.length} sheet(s): ${this.workbook.SheetNames.join(', ')}.`
        );
      }

      // Check for category mapping sheet (optional)
      if (this.workbook.SheetNames.includes("Categories")) {
        await this.extractCategoryInfo();
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to read workbook");
    }
  }

  /**
   * Extract category information from Categories sheet if available
   * This allows linking SKUs to category IDs
   */
  private async extractCategoryInfo(): Promise<void> {
    if (!this.workbook || !this.workbook.SheetNames.includes("Categories")) {
      return;
    }

    try {
      const categoriesSheet = this.workbook.Sheets["Categories"];
      const categories = XLSX.utils.sheet_to_json<{ SKU: string; CategoryID: string }>(
        categoriesSheet
      );

      if (categories && categories.length > 0) {
        categories.forEach((item) => {
          if (item.SKU && item.CategoryID) {
            this.categoryMapping.set(item.SKU, item.CategoryID);
          }
        });
      }
    } catch (error) {
      console.error("Error extracting category information:", error);
    }
  }

  /**
   * Parse the returns sheet and extract raw data
   */
  private parseReturnsSheet(): void {
    const possibleSheetNames = ["Returns", "Returns Report", "Return Report", "Returns_Report"];
    const returnsSheetName = possibleSheetNames.find((name) =>
      this.workbook?.SheetNames.includes(name)
    );

    if (!returnsSheetName) {
      throw new Error("Returns sheet not found");
    }

    const returnsSheet = this.workbook?.Sheets[returnsSheetName];
    if (!returnsSheet) {
      throw new Error("Returns sheet not found");
    }

    // Parse with options to handle various Excel formats - try with range to skip potential empty rows
    const range = returnsSheet['!ref'];
    console.log('[FlipkartReturnsFactory] parseReturnsSheet diagnostics:');
    console.log('  - Sheet range (metadata):', range);

    // IMPORTANT: Some Excel files have incorrect !ref range metadata
    // Fix by scanning for actual data and updating the range
    if (range) {
      const actualRange = this.findActualDataRange(returnsSheet);
      console.log('  - Actual data range (scanned):', actualRange);
      if (actualRange && actualRange !== range) {
        console.log('  - Correcting sheet range from', range, 'to', actualRange);
        returnsSheet['!ref'] = actualRange;
      }
    }

    // Try parsing with explicit range starting from A1
    const rawParsed = XLSX.utils.sheet_to_json(returnsSheet, {
      defval: '', // Default value for empty cells
      blankrows: false, // Skip blank rows
      raw: false, // Format values as strings (dates, numbers)
      range: 0 // Start from first row
    });

    console.log('  - Parsed rows (including potential header):', rawParsed.length);

    // Check if this is native Flipkart format (snake_case) or custom format (Title Case)
    if (rawParsed.length > 0) {
      const firstRow = rawParsed[0] as Record<string, unknown>;
      const columns = Object.keys(firstRow);
      console.log('  - First row columns:', columns);

      // Detect format by checking for snake_case columns
      this.isNativeFormat = columns.some(col => col.includes('_'));
      console.log('  - Detected format:', this.isNativeFormat ? 'Native (snake_case)' : 'Custom (Title Case)');

      if (this.isNativeFormat) {
        // Convert native format to standard format
        const nativeData = rawParsed as FlipkartReturnsDataNative[];
        this.returnsData = nativeData.map(row => this.normalizeNativeRow(row));
        console.log('  - Converted native rows to standard format:', this.returnsData.length);
      } else {
        this.returnsData = rawParsed as FlipkartReturnsData[];
      }
    }

    if (!this.returnsData || this.returnsData.length === 0) {
      // Try alternative parsing method for troubleshooting
      const rawData = XLSX.utils.sheet_to_json(returnsSheet, { header: 1 });
      console.log('  - Raw data rows (with header row):', rawData.length);
      if (rawData.length > 0) {
        console.log('  - Raw headers (row 1):', rawData[0]);
        if (rawData.length > 1) {
          console.log('  - Sample data (row 2):', rawData[1]);
        }
      }

      throw new Error(
        `No data found in returns sheet. ` +
        `Parsed ${rawData.length} raw rows. ` +
        `Please ensure the sheet has data rows below the header row and columns match the expected format.`
      );
    }
  }

  /**
   * Find the actual data range by scanning cells
   * This fixes Excel files with incorrect !ref metadata
   */
  private findActualDataRange(sheet: XLSX.WorkSheet): string | null {
    if (!sheet['!ref']) {
      return null;
    }

    // Decode the current range to get column bounds
    const currentRange = XLSX.utils.decode_range(sheet['!ref']);
    const startCol = currentRange.s.c;
    const endCol = currentRange.e.c;

    // Scan down column A to find the last row with data
    let lastRow = currentRange.s.r;
    const maxRowsToScan = 100000; // Safety limit

    for (let row = currentRange.s.r; row < maxRowsToScan; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: startCol });
      const cell = sheet[cellAddress];

      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
        lastRow = row;
      } else if (row > lastRow + 10) {
        // Stop scanning after 10 consecutive empty rows
        break;
      }
    }

    // If we found more rows than the current range indicates, return new range
    if (lastRow > currentRange.e.r) {
      const newRange = XLSX.utils.encode_range({
        s: { r: currentRange.s.r, c: startCol },
        e: { r: lastRow, c: endCol }
      });
      return newRange;
    }

    return null; // Range is correct
  }

  /**
   * Normalize a native Flipkart row (snake_case) to standard format (Title Case)
   */
  private normalizeNativeRow(nativeRow: FlipkartReturnsDataNative): FlipkartReturnsData {
    return {
      "Return ID": nativeRow.return_id,
      "Order ID": nativeRow.order_item_id,
      "Order Date": nativeRow.return_requested_date, // Using return_requested_date as fallback
      "SKU": nativeRow.sku,
      "FSN": nativeRow.fsn,
      "Product Title": nativeRow.product_title,
      "Quantity": typeof nativeRow.quantity === 'string' ? parseInt(nativeRow.quantity, 10) : nativeRow.quantity,
      "Return Reason": nativeRow.return_reason || '',
      "Return Type": nativeRow.return_type || '',
      "Return Status": nativeRow.return_status || '',
      "Return Initiated Date": nativeRow.return_requested_date,
      "Return Approved Date": nativeRow.return_approval_date,
      "Return Delivered Date": nativeRow.return_completion_date,
      "Refund Amount (INR)": "0", // Not available in native format - will be calculated
      "Reverse Pickup Charges (INR)": "0",
      "Commission Reversal (INR)": "0",
      "Settlement Amount (INR)": "0",
      "QC Status": nativeRow.final_condition_of_returned_product,
    };
  }

  /**
   * Transform raw returns data to FlipkartReturn objects
   */
  private transformReturnsData(): void {
    if (!this.returnsData) {
      throw new Error("No returns data to transform");
    }

    this.returns = this.returnsData
      .map((row) => this.rowToReturn(row))
      .filter((returnItem): returnItem is FlipkartReturn => !!returnItem);
  }

  /**
   * Convert a single row to FlipkartReturn object
   */
  private rowToReturn(row: FlipkartReturnsData): FlipkartReturn | null {
    if (!row["Return ID"] || !row["Order ID"]) {
      console.warn("Skipping row with missing Return ID or Order ID", row);
      return null;
    }

    // Parse financial values
    const refundAmount = this.parseCurrencyValue(row["Refund Amount (INR)"]);
    const reversePickupCharges = this.parseCurrencyValue(row["Reverse Pickup Charges (INR)"]);
    const commissionReversal = this.parseCurrencyValue(row["Commission Reversal (INR)"]);
    const settlementAmount = this.parseCurrencyValue(row["Settlement Amount (INR)"]);
    const restockingFee = this.parseCurrencyValue(row["Restocking Fee (INR)"]);

    // Calculate net loss
    const netLoss = refundAmount + reversePickupCharges - commissionReversal + restockingFee;

    // Parse dates
    const dates = {
      orderDate: this.parseDate(row["Order Date"]),
      returnInitiatedDate: this.parseDate(row["Return Initiated Date"]),
      returnApprovedDate: row["Return Approved Date"]
        ? this.parseDate(row["Return Approved Date"])
        : undefined,
      pickupDate: row["Pickup Date"] ? this.parseDate(row["Pickup Date"]) : undefined,
      returnDeliveredDate: row["Return Delivered Date"]
        ? this.parseDate(row["Return Delivered Date"])
        : undefined,
      refundProcessedDate: row["Refund Processed Date"]
        ? this.parseDate(row["Refund Processed Date"])
        : undefined,
    };

    // Categorize return reason
    const returnReasonCategory = this.categorizeReturnReason(row["Return Reason"]);

    // Parse return type
    const returnType = this.parseReturnType(row["Return Type"]);

    // Parse return status
    const returnStatus = this.parseReturnStatus(row["Return Status"]);

    // Parse QC status
    const qcStatus = row["QC Status"] ? this.parseQCStatus(row["QC Status"]) : FlipkartQCStatus.PENDING;

    // Determine if resaleable
    const resaleable = qcStatus === FlipkartQCStatus.RESALEABLE;

    // Get category ID if available
    const categoryId = this.getCategoryId(row["SKU"]);

    const now = new Date().toISOString();

    return {
      returnId: row["Return ID"].toString(),
      orderId: row["Order ID"].toString(),
      platform: 'flipkart',
      sku: row["SKU"].toString(),
      fsn: row["FSN"]?.toString() || "",
      productTitle: row["Product Title"] || "",
      quantity: Number(row["Quantity"]) || 1,
      returnReason: row["Return Reason"] || "",
      returnReasonCategory,
      returnType,
      returnStatus,
      dates,
      financials: {
        refundAmount,
        reversePickupCharges,
        commissionReversal,
        settlementAmount,
        restockingFee,
        netLoss,
      },
      location: {
        returnLocation: row["Return Location"],
        warehouseLocation: row["Warehouse Location"],
      },
      qcStatus,
      resaleable,
      categoryId,
      metadata: {
        createdAt: now,
        updatedAt: now,
        importedAt: now,
      },
    };
  }

  /**
   * Parse currency string to number
   * Handles formats like "₹1,234.56", "1234.56", "1,234"
   */
  private parseCurrencyValue(value: string | number | undefined): number {
    if (!value) return 0;
    if (typeof value === "number") return value;
    // Remove currency symbols, commas, and whitespace
    return Number(value.replace(/[₹,\s]/g, "")) || 0;
  }

  /**
   * Parse date string to Date object
   * Handles various date formats from Flipkart Excel
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    // Try parsing as ISO string first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try parsing DD-MM-YYYY or DD/MM/YYYY format
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }

    // Fallback to current date if parsing fails
    console.warn(`Failed to parse date: ${dateStr}, using current date`);
    return new Date();
  }

  /**
   * Categorize return reason text into standardized categories
   */
  private categorizeReturnReason(reason: string): FlipkartReturnReasonCategory {
    if (!reason) return FlipkartReturnReasonCategory.OTHER;

    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('defective') || lowerReason.includes('defect')) {
      return FlipkartReturnReasonCategory.DEFECTIVE;
    }
    if (lowerReason.includes('quality')) {
      return FlipkartReturnReasonCategory.QUALITY_ISSUE;
    }
    if (lowerReason.includes('wrong item') || lowerReason.includes('wrong product')) {
      return FlipkartReturnReasonCategory.WRONG_ITEM;
    }
    if (lowerReason.includes('damaged') || lowerReason.includes('damage')) {
      return FlipkartReturnReasonCategory.DAMAGED;
    }
    if (lowerReason.includes('not as described') || lowerReason.includes('misleading')) {
      return FlipkartReturnReasonCategory.NOT_AS_DESCRIBED;
    }
    if (lowerReason.includes('size') || lowerReason.includes('color') || lowerReason.includes('colour')) {
      return FlipkartReturnReasonCategory.SIZE_COLOR_ISSUE;
    }
    if (lowerReason.includes('changed mind') || lowerReason.includes('no longer needed')) {
      return FlipkartReturnReasonCategory.CUSTOMER_CHANGED_MIND;
    }
    if (lowerReason.includes('duplicate')) {
      return FlipkartReturnReasonCategory.DUPLICATE_ORDER;
    }
    if (lowerReason.includes('late') || lowerReason.includes('delay')) {
      return FlipkartReturnReasonCategory.LATE_DELIVERY;
    }
    if (lowerReason.includes('better price') || lowerReason.includes('cheaper')) {
      return FlipkartReturnReasonCategory.BETTER_PRICE;
    }

    return FlipkartReturnReasonCategory.OTHER;
  }

  /**
   * Parse return type string to enum
   */
  private parseReturnType(type: string): FlipkartReturnType {
    if (!type) return FlipkartReturnType.CUSTOMER_RETURN;

    const lowerType = type.toLowerCase();

    if (lowerType.includes('customer')) {
      return FlipkartReturnType.CUSTOMER_RETURN;
    }
    if (lowerType.includes('seller')) {
      return FlipkartReturnType.SELLER_RETURN;
    }
    if (lowerType.includes('quality')) {
      return FlipkartReturnType.QUALITY_ISSUE;
    }
    if (lowerType.includes('rto') || lowerType.includes('return to origin')) {
      return FlipkartReturnType.RTO;
    }

    return FlipkartReturnType.CUSTOMER_RETURN;
  }

  /**
   * Parse return status string to enum
   */
  private parseReturnStatus(status: string): FlipkartReturnStatus {
    if (!status) return FlipkartReturnStatus.INITIATED;

    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('initiated') || lowerStatus.includes('requested')) {
      return FlipkartReturnStatus.INITIATED;
    }
    if (lowerStatus.includes('approved')) {
      return FlipkartReturnStatus.APPROVED;
    }
    if (lowerStatus.includes('pickup scheduled')) {
      return FlipkartReturnStatus.PICKUP_SCHEDULED;
    }
    if (lowerStatus.includes('picked up')) {
      return FlipkartReturnStatus.PICKED_UP;
    }
    if (lowerStatus.includes('in transit')) {
      return FlipkartReturnStatus.IN_TRANSIT;
    }
    if (lowerStatus.includes('delivered to warehouse') || lowerStatus.includes('warehouse')) {
      return FlipkartReturnStatus.DELIVERED_TO_WAREHOUSE;
    }
    if (lowerStatus.includes('qc pending')) {
      return FlipkartReturnStatus.QC_PENDING;
    }
    if (lowerStatus.includes('qc completed')) {
      return FlipkartReturnStatus.QC_COMPLETED;
    }
    if (lowerStatus.includes('refunded')) {
      return FlipkartReturnStatus.REFUNDED;
    }
    if (lowerStatus.includes('rejected')) {
      return FlipkartReturnStatus.REJECTED;
    }
    if (lowerStatus.includes('cancelled')) {
      return FlipkartReturnStatus.CANCELLED;
    }

    return FlipkartReturnStatus.INITIATED;
  }

  /**
   * Parse QC status string to enum
   */
  private parseQCStatus(status: string): FlipkartQCStatus {
    if (!status) return FlipkartQCStatus.PENDING;

    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('resaleable') || lowerStatus.includes('resellable')) {
      return FlipkartQCStatus.RESALEABLE;
    }
    if (lowerStatus.includes('damaged')) {
      return FlipkartQCStatus.DAMAGED;
    }
    if (lowerStatus.includes('defective')) {
      return FlipkartQCStatus.DEFECTIVE;
    }
    if (lowerStatus.includes('missing') || lowerStatus.includes('incomplete')) {
      return FlipkartQCStatus.MISSING_PARTS;
    }
    if (lowerStatus.includes('unsealed') || lowerStatus.includes('opened')) {
      return FlipkartQCStatus.UNSEALED;
    }
    if (lowerStatus.includes('not received')) {
      return FlipkartQCStatus.NOT_RECEIVED;
    }

    return FlipkartQCStatus.PENDING;
  }

  /**
   * Get category ID for SKU from category mapping
   */
  private getCategoryId(sku: string): string | undefined {
    if (this.categoryMapping.has(sku)) {
      return this.categoryMapping.get(sku);
    }
    return undefined;
  }

  /**
   * Get parsed returns (for external access)
   */
  public getReturns(): FlipkartReturn[] {
    return this.returns;
  }

  /**
   * Get validation summary
   */
  public getValidationSummary(): {
    totalRows: number;
    validReturns: number;
    skippedRows: number;
  } {
    return {
      totalRows: this.returnsData.length,
      validReturns: this.returns.length,
      skippedRows: this.returnsData.length - this.returns.length,
    };
  }
}
