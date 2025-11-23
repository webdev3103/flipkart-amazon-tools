import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderMetrics from '../OrderMetrics';
import { ProductSummary } from '../../../home/services/base.transformer';
import { Product } from '../../../../services/product.service';
import { Category } from '../../../../services/category.service';
import { FlipkartReturn, FlipkartReturnStatus } from '../../../../types/flipkartReturns.type';

// Mock data
const mockCategories: Category[] = [
  { 
    id: 'cat1', 
    name: 'Category 1', 
    description: '',
    tag: '',
    createdAt: { seconds: 0, nanoseconds: 0 } as any,
    updatedAt: { seconds: 0, nanoseconds: 0 } as any
  },
];

const mockProducts: Product[] = [
  { 
    id: 'prod1', 
    sku: 'SKU1', 
    name: 'Product 1', 
    platform: 'flipkart',
    visibility: 'visible',
    sellingPrice: 100, 
    categoryId: 'cat1',
    metadata: {},
    description: ''
  },
];

const mockOrders: ProductSummary[] = [
  {
    orderId: 'ord1',
    name: 'Product 1',
    quantity: '2',
    product: mockProducts[0],
    type: 'flipkart',
    SKU: 'SKU1'
  },
  {
    orderId: 'ord2',
    name: 'Product 1',
    quantity: '1',
    product: mockProducts[0],
    type: 'flipkart',
    SKU: 'SKU1'
  }
];

const mockReturns: FlipkartReturn[] = [
  {
    returnId: 'ret1',
    orderId: 'ord1',
    sku: 'SKU1',
    fsn: 'FSN1',
    platform: 'flipkart',
    productTitle: 'Product 1',
    returnStatus: FlipkartReturnStatus.QC_COMPLETED,
    financials: {
      refundAmount: 100,
      reversePickupCharges: 0,
      commissionReversal: 0,
      settlementAmount: 0,
      restockingFee: 0,
      netLoss: 100
    },
    dates: {
      orderDate: new Date('2023-01-01'),
      returnInitiatedDate: new Date('2023-01-03'),
      returnDeliveredDate: new Date('2023-01-05')
    },
    quantity: 1,
    returnReason: 'Defective',
    returnType: 'Customer Return' as any,
    returnReasonCategory: 'Quality Issue' as any,
    qcStatus: 'Resaleable' as any,
    resaleable: false,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedAt: new Date().toISOString()
    }
  }
];

describe('OrderMetrics', () => {
  it('renders order metrics correctly', () => {
    render(
      <OrderMetrics 
        orders={mockOrders} 
        returns={[]} 
        products={mockProducts} 
        categories={mockCategories} 
      />
    );

    // Order Volume (was Total Orders)
    expect(screen.getByText('Order Volume')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Revenue Health (was Total Revenue)
    expect(screen.getByText('Revenue Health')).toBeInTheDocument();
    // Gross revenue is now secondary text
    const revenues = screen.getAllByText(/Gross: ₹300.00/);
    expect(revenues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders return metrics correctly', () => {
    render(
      <OrderMetrics 
        orders={mockOrders} 
        returns={mockReturns} 
        products={mockProducts} 
        categories={mockCategories} 
      />
    );

    // Order Volume contains Total Returns
    expect(screen.getByText('Order Volume')).toBeInTheDocument();
    expect(screen.getByText(/1 Returns/)).toBeInTheDocument();

    // Return Impact (was Return Rate)
    expect(screen.getByText('Return Impact')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();

    // Revenue Health contains Refund Value and Net Revenue
    expect(screen.getByText('Revenue Health')).toBeInTheDocument();
    expect(screen.getByText(/Refunds: -₹100.00/)).toBeInTheDocument();
    
    // Net Revenue is primary
    expect(screen.getByText('₹200.00')).toBeInTheDocument();
  });

  it('handles zero orders and returns gracefully', () => {
    render(
      <OrderMetrics 
        orders={[]} 
        returns={[]} 
        products={mockProducts} 
        categories={mockCategories} 
      />
    );

    // There might be multiple '0's, so we check if they exist
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
    
    // Check for formatted currency values
    const currencyZeros = screen.getAllByText('₹0.00');
    expect(currencyZeros.length).toBeGreaterThan(0);

    // Check for percentage
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
