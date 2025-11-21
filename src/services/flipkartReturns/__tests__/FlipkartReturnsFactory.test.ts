import * as XLSX from "xlsx";
import { FlipkartReturnsFactory } from "../FlipkartReturnsFactory";
import {
  FlipkartReturnReasonCategory,
  FlipkartReturnType,
  FlipkartReturnStatus,
  FlipkartQCStatus,
} from "../../../types/flipkartReturns.type";

describe("FlipkartReturnsFactory", () => {
  /**
   * Helper function to create a mock Excel file with returns data
   */
  const createMockExcelFile = (data: any[], sheetName = "Returns"): File => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    // Create a mock File object with arrayBuffer method
    const mockFile = {
      name: "test-returns.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      arrayBuffer: async () => Promise.resolve(excelBuffer),
    } as File;

    return mockFile;
  };

  describe("process", () => {
    it("should parse valid returns data successfully", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Test Product 1",
          "Quantity": 1,
          "Return Reason": "Defective product",
          "Return Type": "Customer Return",
          "Return Status": "Refunded",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "₹1,500",
          "Reverse Pickup Charges (INR)": "₹100",
          "Commission Reversal (INR)": "₹200",
          "Settlement Amount (INR)": "₹1,400",
          "QC Status": "Damaged",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns).toHaveLength(1);
      expect(returns[0]).toMatchObject({
        returnId: "RET001",
        orderId: "ORD001",
        platform: "flipkart",
        sku: "SKU123",
        fsn: "FSN123",
        productTitle: "Test Product 1",
        quantity: 1,
        returnReason: "Defective product",
        returnReasonCategory: FlipkartReturnReasonCategory.DEFECTIVE,
        returnType: FlipkartReturnType.CUSTOMER_RETURN,
        returnStatus: FlipkartReturnStatus.REFUNDED,
        resaleable: false, // Damaged QC status
      });

      expect(returns[0].financials).toMatchObject({
        refundAmount: 1500,
        reversePickupCharges: 100,
        commissionReversal: 200,
        settlementAmount: 1400,
        restockingFee: 0,
        netLoss: 1400, // 1500 + 100 - 200 + 0
      });
    });

    it("should handle multiple returns", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product 1",
          "Quantity": 1,
          "Return Reason": "Quality Issue",
          "Return Type": "Quality Issue",
          "Return Status": "Approved",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
        {
          "Return ID": "RET002",
          "Order ID": "ORD002",
          "Order Date": "16-01-2024",
          "SKU": "SKU456",
          "FSN": "FSN456",
          "Product Title": "Product 2",
          "Quantity": 2,
          "Return Reason": "Wrong item sent",
          "Return Type": "Customer Return",
          "Return Status": "Picked Up",
          "Return Initiated Date": "21-01-2024",
          "Refund Amount (INR)": "2000",
          "Reverse Pickup Charges (INR)": "75",
          "Commission Reversal (INR)": "150",
          "Settlement Amount (INR)": "1925",
          "QC Status": "Resaleable",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns).toHaveLength(2);
      expect(returns[0].returnId).toBe("RET001");
      expect(returns[1].returnId).toBe("RET002");
      expect(returns[1].resaleable).toBe(true);
    });

    it("should skip rows with missing Return ID", async () => {
      const mockData = [
        {
          "Return ID": "",
          "Order ID": "ORD001",
          "SKU": "SKU123",
          "Product Title": "Product 1",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
        {
          "Return ID": "RET002",
          "Order ID": "ORD002",
          "SKU": "SKU456",
          "Product Title": "Product 2",
          "Quantity": 1,
          "Return Reason": "Quality Issue",
          "Return Type": "Customer Return",
          "Return Status": "Approved",
          "Return Initiated Date": "21-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "60",
          "Commission Reversal (INR)": "120",
          "Settlement Amount (INR)": "1440",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns).toHaveLength(1);
      expect(returns[0].returnId).toBe("RET002");
    });

    it("should throw error if sheet not found", async () => {
      const mockData = [{ "Return ID": "RET001" }];
      const file = createMockExcelFile(mockData, "WrongSheetName");
      const factory = new FlipkartReturnsFactory(file);

      await expect(factory.process()).rejects.toThrow(/Required sheet not found/);
    });

    it("should throw error if sheet is empty", async () => {
      const mockData: any[] = [];
      const file = createMockExcelFile(mockData, "Returns");
      const factory = new FlipkartReturnsFactory(file);

      await expect(factory.process()).rejects.toThrow(/(No data found in returns sheet|is empty or invalid)/);
    });
  });

  describe("Return Reason Categorization", () => {
    it("should categorize defective reasons correctly", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Product is defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].returnReasonCategory).toBe(FlipkartReturnReasonCategory.DEFECTIVE);
    });

    it("should categorize quality issue reasons correctly", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Poor quality material",
          "Return Type": "Quality Issue",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].returnReasonCategory).toBe(FlipkartReturnReasonCategory.QUALITY_ISSUE);
    });

    it("should categorize wrong item reasons correctly", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Wrong item sent",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].returnReasonCategory).toBe(FlipkartReturnReasonCategory.WRONG_ITEM);
    });

    it("should categorize damaged reasons correctly", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Damaged in transit",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].returnReasonCategory).toBe(FlipkartReturnReasonCategory.DAMAGED);
    });

    it("should default to OTHER for unknown reasons", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Some random reason",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].returnReasonCategory).toBe(FlipkartReturnReasonCategory.OTHER);
    });
  });

  describe("Currency Parsing", () => {
    it("should parse currency with rupee symbol", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "₹1,234.56",
          "Reverse Pickup Charges (INR)": "₹100.00",
          "Commission Reversal (INR)": "₹200.00",
          "Settlement Amount (INR)": "₹1,134.56",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].financials.refundAmount).toBe(1234.56);
      expect(returns[0].financials.reversePickupCharges).toBe(100);
      expect(returns[0].financials.commissionReversal).toBe(200);
    });

    it("should parse currency without rupee symbol", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1234.56",
          "Reverse Pickup Charges (INR)": "100",
          "Commission Reversal (INR)": "200",
          "Settlement Amount (INR)": "1134.56",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].financials.refundAmount).toBe(1234.56);
    });

    it("should handle missing currency values as zero", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "",
          "Commission Reversal (INR)": "",
          "Settlement Amount (INR)": "1000",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].financials.reversePickupCharges).toBe(0);
      expect(returns[0].financials.commissionReversal).toBe(0);
    });
  });

  describe("Net Loss Calculation", () => {
    it("should calculate net loss correctly", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "100",
          "Commission Reversal (INR)": "200",
          "Settlement Amount (INR)": "1400",
          "Restocking Fee (INR)": "50",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      // Net Loss = refundAmount + reversePickupCharges - commissionReversal + restockingFee
      // Net Loss = 1500 + 100 - 200 + 50 = 1450
      expect(returns[0].financials.netLoss).toBe(1450);
    });
  });

  describe("QC Status Parsing", () => {
    it("should set resaleable to true for RESALEABLE QC status", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Customer changed mind",
          "Return Type": "Customer Return",
          "Return Status": "QC Completed",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
          "QC Status": "Resaleable",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].qcStatus).toBe(FlipkartQCStatus.RESALEABLE);
      expect(returns[0].resaleable).toBe(true);
    });

    it("should set resaleable to false for non-RESALEABLE QC status", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "QC Completed",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
          "QC Status": "Defective",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      expect(returns[0].qcStatus).toBe(FlipkartQCStatus.DEFECTIVE);
      expect(returns[0].resaleable).toBe(false);
    });
  });

  describe("getValidationSummary", () => {
    it("should return validation summary with correct counts", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU123",
          "FSN": "FSN123",
          "Product Title": "Product 1",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1000",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "950",
        },
        {
          "Return ID": "",
          "Order ID": "ORD002",
          "SKU": "SKU456",
          "Product Title": "Product 2",
          "Quantity": 1,
          "Return Reason": "Damaged",
          "Return Type": "Customer Return",
          "Return Status": "Initiated",
          "Return Initiated Date": "21-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "60",
          "Commission Reversal (INR)": "120",
          "Settlement Amount (INR)": "1440",
        },
        {
          "Return ID": "RET003",
          "Order ID": "ORD003",
          "Order Date": "17-01-2024",
          "SKU": "SKU789",
          "FSN": "FSN789",
          "Product Title": "Product 3",
          "Quantity": 1,
          "Return Reason": "Quality Issue",
          "Return Type": "Quality Issue",
          "Return Status": "Approved",
          "Return Initiated Date": "22-01-2024",
          "Refund Amount (INR)": "2000",
          "Reverse Pickup Charges (INR)": "75",
          "Commission Reversal (INR)": "150",
          "Settlement Amount (INR)": "1925",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      await factory.process();

      const summary = factory.getValidationSummary();

      expect(summary.totalRows).toBe(3);
      expect(summary.validReturns).toBe(2);
      expect(summary.skippedRows).toBe(1);
    });
  });

  describe("Identifier Sanitization", () => {
    it("should remove 'SKU:' prefix from SKU values", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU:ABC123",
          "FSN": "FSN123",
          "Product Title": "Test Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Approved",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "1450",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      await factory.process();

      expect(factory.returns).toHaveLength(1);
      expect(factory.returns[0].sku).toBe("ABC123");
      expect(factory.returns[0].sku).not.toContain("SKU:");
    });

    it("should remove 'ORDER:' prefix from Order ID values", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORDER:12345678",
          "Order Date": "15-01-2024",
          "SKU": "ABC123",
          "FSN": "FSN123",
          "Product Title": "Test Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Approved",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "1450",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      await factory.process();

      expect(factory.returns).toHaveLength(1);
      expect(factory.returns[0].orderId).toBe("12345678");
      expect(factory.returns[0].orderId).not.toContain("ORDER:");
    });

    it("should handle SKU with spaces around colon", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "SKU : XYZ789",
          "FSN": "FSN789",
          "Product Title": "Test Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Approved",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "1450",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      await factory.process();

      expect(factory.returns).toHaveLength(1);
      expect(factory.returns[0].sku).toBe("XYZ789");
    });

    it("should preserve SKU values without prefix", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORD001",
          "Order Date": "15-01-2024",
          "SKU": "PLAIN123",
          "FSN": "FSN123",
          "Product Title": "Test Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Approved",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "1450",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      await factory.process();

      expect(factory.returns).toHaveLength(1);
      expect(factory.returns[0].sku).toBe("PLAIN123");
    });

    it("should handle both SKU and Order ID prefixes in same row", async () => {
      const mockData = [
        {
          "Return ID": "RET001",
          "Order ID": "ORDER:99999999",
          "Order Date": "15-01-2024",
          "SKU": "SKU:TEST456",
          "FSN": "FSN456",
          "Product Title": "Test Product",
          "Quantity": 1,
          "Return Reason": "Defective",
          "Return Type": "Customer Return",
          "Return Status": "Approved",
          "Return Initiated Date": "20-01-2024",
          "Refund Amount (INR)": "1500",
          "Reverse Pickup Charges (INR)": "50",
          "Commission Reversal (INR)": "100",
          "Settlement Amount (INR)": "1450",
        },
      ];

      const file = createMockExcelFile(mockData);
      const factory = new FlipkartReturnsFactory(file);
      await factory.process();

      expect(factory.returns).toHaveLength(1);
      expect(factory.returns[0].sku).toBe("TEST456");
      expect(factory.returns[0].orderId).toBe("99999999");
    });
  });
});
