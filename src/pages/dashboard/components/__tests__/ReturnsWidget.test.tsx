import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReturnsWidget from '../ReturnsWidget';
import { FlipkartReturn, FlipkartReturnStatus, FlipkartReturnReasonCategory, FlipkartReturnType } from '../../../../types/flipkartReturns.type';

// Wrapper component with Router
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ReturnsWidget', () => {
  const mockReturns: FlipkartReturn[] = [
    {
      returnId: 'RET001',
      orderId: 'ORD001',
      platform: 'flipkart',
      sku: 'SKU001',
      fsn: 'FSN001',
      productTitle: 'Test Product 1',
      quantity: 1,
      returnReason: 'Defective product',
      returnReasonCategory: FlipkartReturnReasonCategory.DEFECTIVE,
      returnType: FlipkartReturnType.CUSTOMER_RETURN,
      returnStatus: FlipkartReturnStatus.REFUNDED,
      dates: {
        orderDate: new Date('2024-01-01'),
        returnInitiatedDate: new Date('2024-01-05'),
      },
      financials: {
        refundAmount: 500,
        reversePickupCharges: 50,
        commissionReversal: 25,
        settlementAmount: 525,
        restockingFee: 0,
        netLoss: 525,
      },
      resaleable: false,
      qcStatus: undefined,
      metadata: {
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        importedAt: '2024-01-10T00:00:00Z',
      },
    },
    {
      returnId: 'RET002',
      orderId: 'ORD002',
      platform: 'flipkart',
      sku: 'SKU002',
      fsn: 'FSN002',
      productTitle: 'Test Product 2',
      quantity: 2,
      returnReason: 'Quality issue',
      returnReasonCategory: FlipkartReturnReasonCategory.QUALITY_ISSUE,
      returnType: FlipkartReturnType.CUSTOMER_RETURN,
      returnStatus: FlipkartReturnStatus.REFUNDED,
      dates: {
        orderDate: new Date('2024-01-02'),
        returnInitiatedDate: new Date('2024-01-06'),
      },
      financials: {
        refundAmount: 800,
        reversePickupCharges: 60,
        commissionReversal: 40,
        settlementAmount: 820,
        restockingFee: 0,
        netLoss: 820,
      },
      resaleable: true,
      qcStatus: undefined,
      metadata: {
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        importedAt: '2024-01-10T00:00:00Z',
      },
    },
  ];

  it('should render loading state', () => {
    render(<ReturnsWidget returns={[]} loading={true} />, { wrapper: Wrapper });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state when no returns', () => {
    render(<ReturnsWidget returns={[]} loading={false} />, { wrapper: Wrapper });
    expect(screen.getByText('No Returns Data')).toBeInTheDocument();
    expect(screen.getByText('Upload Flipkart returns to see insights')).toBeInTheDocument();
    expect(screen.getByText('Upload Returns')).toBeInTheDocument();
  });

  it('should render returns data correctly', () => {
    render(<ReturnsWidget returns={mockReturns} loading={false} />, { wrapper: Wrapper });

    // Check header
    expect(screen.getByText('Returns Overview')).toBeInTheDocument();

    // Check total net loss (525 + 820 = 1345)
    expect(screen.getByText('Total Net Loss')).toBeInTheDocument();
    expect(screen.getByText('₹1,345')).toBeInTheDocument();

    // Check resaleable count (1 out of 2 = 50%)
    expect(screen.getByText('Resaleable Returns')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check footer
    expect(screen.getByText('2 total returns')).toBeInTheDocument();
  });

  it('should display recent returns', () => {
    render(<ReturnsWidget returns={mockReturns} loading={false} />, { wrapper: Wrapper });

    // Check recent returns section
    expect(screen.getByText('Recent Returns')).toBeInTheDocument();
    expect(screen.getByText('SKU002')).toBeInTheDocument();
  });

  it('should have navigation button to returns list', () => {
    render(<ReturnsWidget returns={mockReturns} loading={false} />, { wrapper: Wrapper });

    const viewAllButton = screen.getByText('View All Returns');
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton.closest('a')).toHaveAttribute('href', '/flipkart-returns');
  });

  it('should calculate resaleable percentage correctly', () => {
    const allResaleable: FlipkartReturn[] = [
      { ...mockReturns[0], resaleable: true },
      { ...mockReturns[1], resaleable: true },
    ];

    render(<ReturnsWidget returns={allResaleable} loading={false} />, { wrapper: Wrapper });

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should display top loss category', () => {
    render(<ReturnsWidget returns={mockReturns} loading={false} />, { wrapper: Wrapper });

    expect(screen.getByText('Top Loss Reason')).toBeInTheDocument();
    // Quality Issue has higher loss (820 vs 525)
    expect(screen.getByText('Quality Issue')).toBeInTheDocument();
  });
});
