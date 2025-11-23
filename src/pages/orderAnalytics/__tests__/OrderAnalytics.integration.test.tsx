import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OrderAnalytics from '../index';
import orderAnalyticsReducer from '../../../store/slices/orderAnalyticsSlice';
import flipkartReturnsReducer from '../../../store/slices/flipkartReturnsSlice';
import productsReducer from '../../../store/slices/productsSlice';
import categoriesReducer from '../../../store/slices/categoriesSlice';
import allOrdersForAnalyticsReducer from '../../../store/slices/allOrdersForAnalyticsSlice';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock services
jest.mock('../../../services/product.service', () => ({
  ProductService: jest.fn().mockImplementation(() => ({
    getProductsWithCategoryGroups: jest.fn().mockResolvedValue([
      { id: 'prod1', sku: 'SKU1', name: 'Product 1', platform: 'flipkart', sellingPrice: 100 }
    ])
  }))
}));

jest.mock('../../../services/category.service', () => ({
  CategoryService: jest.fn().mockImplementation(() => ({
    getCategories: jest.fn().mockResolvedValue([
      { id: 'cat1', name: 'Category 1' }
    ])
  }))
}));

// Mock AllOrdersForAnalyticsService
jest.mock('../../../services/allOrdersForAnalytics.service', () => ({
  AllOrdersForAnalyticsService: jest.fn().mockImplementation(() => ({
    fetchAllDailyOrderDocuments: jest.fn().mockResolvedValue([
      {
        date: new Date().toISOString(),
        orders: [
          { 
            orderId: 'ord1', 
            SKU: 'SKU1', 
            quantity: '1',  
            type: 'flipkart', 
            name: 'Product 1',
            product: { sellingPrice: 100 }
          }
        ]
      }
    ])
  }))
}));

// Mock flipkartReturnsService
jest.mock('../../../services/flipkartReturns/flipkartReturns.service', () => ({
  flipkartReturnsService: {
    getAllReturns: jest.fn().mockResolvedValue([
      {
        returnId: 'ret1',
        orderId: 'ord1',
        sku: 'SKU1',
        fsn: 'FSN1',
        platform: 'flipkart',
        productTitle: 'Product 1',
        returnStatus: 'QC Completed', // FlipkartReturnStatus.QC_COMPLETED
        financials: {
          refundAmount: 100,
          reversePickupCharges: 0,
          commissionReversal: 0,
          settlementAmount: 0,
          restockingFee: 0,
          netLoss: 100
        },
        dates: {
          orderDate: new Date(),
          returnInitiatedDate: new Date(),
          returnDeliveredDate: new Date()
        },
        quantity: 1,
        returnReason: 'Defective',
        returnType: 'Customer Return', // FlipkartReturnType.CUSTOMER_RETURN
        returnReasonCategory: 'Quality Issue', // FlipkartReturnReasonCategory.QUALITY_ISSUE
        qcStatus: 'Resaleable', // FlipkartQCStatus.RESALEABLE
        resaleable: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importedAt: new Date().toISOString()
        }
      }
    ])
  }
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      orderAnalytics: orderAnalyticsReducer,
      flipkartReturns: flipkartReturnsReducer,
      allOrdersForAnalytics: allOrdersForAnalyticsReducer,
      products: productsReducer,
      categories: categoriesReducer,
      auth: (state = { isAuthenticated: true, user: { uid: 'test' } }) => state,
    },
    preloadedState: {
        flipkartReturns: {
            returns: [],
            loading: false,
            error: null,
            uploadStatus: 'idle',
            uploadError: null,
            uploadProgress: 0,
            filters: {},
            filteredReturns: [],
            selectedReturn: null,
            uploading: false
        } as any
    }
  });
};

describe('OrderAnalytics Integration', () => {
  it('renders and fetches data correctly', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <OrderAnalytics />
        </LocalizationProvider>
      </Provider>
    );

    // Wait for data to be fetched and displayed
    await waitFor(() => {
      expect(screen.getByText('Revenue Health')).toBeInTheDocument();
    });

    // Verify metrics are displayed
    
    // Revenue Health
    const revenueHealthCard = screen.getByText('Revenue Health').closest('.MuiPaper-root');
    expect(revenueHealthCard).toHaveTextContent('₹0.00'); // Net Revenue (100 - 100 = 0)
    expect(revenueHealthCard).toHaveTextContent('Gross: ₹100.00'); // Total Revenue (100)
    expect(revenueHealthCard).toHaveTextContent('Refunds: -₹100.00'); // Refunds (100)

    // Order Volume
    const orderVolumeCard = screen.getByText('Order Volume').closest('.MuiPaper-root');
    expect(orderVolumeCard).toHaveTextContent('1'); // Total Orders
    expect(orderVolumeCard).toHaveTextContent('1 Returns'); // Returns count

    // Return Impact
    const returnImpactCard = screen.getByText('Return Impact').closest('.MuiPaper-root');
    expect(returnImpactCard).toHaveTextContent('100.0%'); // Return Rate (1/1 * 100)
  });
});
