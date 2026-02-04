import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { HistoricalCategoryData } from '../hooks/useHistoricalData';
import ComparisonIndicator from './ComparisonIndicator';
import { Category } from '../../../services/category.service';
import { ProductSummary } from '../../home/services/base.transformer';
import { FormattedCurrency } from '../../../components/FormattedCurrency';
import CategoryProductsList from './CategoryProductsList';
import { DataTable, Column } from '../../../components/DataTable/DataTable';

interface MergedCategoryTableProps {
  historicalData: HistoricalCategoryData[];
  orders: ProductSummary[];
  categories: Category[];
}

interface MergedCategoryRow {
  categoryId: string;
  categoryName: string;
  totalOrders: number;
  totalQuantity: number;
  todayOrders: number;
  yesterdayOrders: number;
  orderChange: number;
  orderChangePercent: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

const MergedCategoryTable: React.FC<MergedCategoryTableProps> = ({
  historicalData,
  orders,
  categories
}) => {
  const [loading, setLoading] = useState(true);
  const [mergedData, setMergedData] = useState<MergedCategoryRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized category mapping
  const categoryIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(cat => {
      if (cat.id) {
        map[cat.id] = cat.name;
      }
    });
    return map;
  }, [categories]);

  // Memoized products for category mapping
  const productsForCategory = useMemo(() => {
    const map: Record<string, ProductSummary[]> = {};
    orders.forEach(order => {
      const categoryId = order.product?.categoryId;
      const category = categoryId ? (categoryIdToName[categoryId] || 'Uncategorized') : 'Uncategorized';
      if (!map[category]) {
        map[category] = [];
      }
      map[category].push(order);
    });
    return map;
  }, [orders, categoryIdToName]);

  // Get products for selected category (memoized)
  const getProductsForCategory = useCallback((categoryName: string): ProductSummary[] => {
    return productsForCategory[categoryName] || [];
  }, [productsForCategory]);

  // Memoized financial data calculation
  const financialData = useMemo(() => {
    const data: Record<string, { revenue: number; cost: number; profit: number; quantity: number }> = {};

    // Group orders by category for batch processing
    const ordersByCategory: Record<string, ProductSummary[]> = {};
    orders.forEach(order => {
      const categoryId = order.product?.categoryId;
      const categoryName = categoryId ? (categoryIdToName[categoryId] || 'Uncategorized') : 'Uncategorized';

      if (!ordersByCategory[categoryName]) {
        ordersByCategory[categoryName] = [];
      }
      ordersByCategory[categoryName].push(order);
    });

    // Calculate financial data for each category
    Object.entries(ordersByCategory).forEach(([categoryName, categoryOrders]) => {
      data[categoryName] = { revenue: 0, cost: 0, profit: 0, quantity: 0 };

      categoryOrders.forEach(order => {
        const quantity = parseInt(order.quantity) || 1;
        const sellingPrice = order.product?.sellingPrice || 0;
        const costPrice = 0; // Cost calculation removed

        data[categoryName].revenue += sellingPrice * quantity;
        data[categoryName].cost += costPrice * quantity;
        data[categoryName].quantity += quantity;
      });

      data[categoryName].profit = data[categoryName].revenue - data[categoryName].cost;
    });

    return data;
  }, [orders, categoryIdToName]);

  // Memoized merged data calculation
  const calculateMergedData = useMemo(() => {
    if (!historicalData.length) return [];

    const merged: MergedCategoryRow[] = [];

    // Add all categories from historical data
    historicalData.forEach(historical => {
      const financial = financialData[historical.categoryName] || { revenue: 0, cost: 0, profit: 0, quantity: 0 };
      const profitMargin = financial.revenue > 0 ? (financial.profit / financial.revenue) * 100 : 0;

      merged.push({
        categoryId: historical.categoryId,
        categoryName: historical.categoryName,
        totalOrders: historical.totalOrders,
        totalQuantity: financial.quantity,
        todayOrders: historical.todayOrders,
        yesterdayOrders: historical.yesterdayOrders,
        orderChange: historical.orderChange,
        orderChangePercent: historical.orderChangePercent,
        totalRevenue: financial.revenue,
        totalCost: financial.cost,
        profit: financial.profit,
        profitMargin,
      });
    });

    return merged;
  }, [historicalData, financialData]);

  // Update merged data when calculation changes
  useEffect(() => {
    setMergedData(calculateMergedData);
    setLoading(false);
  }, [calculateMergedData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return mergedData;
    const lowerQuery = searchQuery.toLowerCase();
    return mergedData.filter(row =>
      row.categoryName.toLowerCase().includes(lowerQuery)
    );
  }, [mergedData, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    return mergedData.reduce((acc, row) => ({
      orders: acc.orders + row.totalOrders,
      revenue: acc.revenue + row.totalRevenue
    }), { orders: 0, revenue: 0 });
  }, [mergedData]);

  const columns: Column<MergedCategoryRow>[] = [
    {
      id: 'categoryName',
      label: 'Category',
      minWidth: 150,
    },
    {
      id: 'totalOrders',
      label: 'Orders',
      align: 'right',
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" fontWeight="medium">{(value as number).toLocaleString()}</Typography>
      ),
    },
    {
      id: 'totalQuantity',
      label: 'Qty',
      align: 'right',
      minWidth: 80,
      format: (value) => (
        <Typography variant="body2">{(value as number).toLocaleString()}</Typography>
      ),
    },
    {
      id: 'orderChange',
      label: 'Trend',
      align: 'right',
      minWidth: 100,
      format: (value, row) => (
        <ComparisonIndicator
          value={row?.orderChange || 0}
          percentage={row?.orderChangePercent || 0}
          size="small"
        />
      ),
    },
    {
      id: 'totalRevenue',
      label: 'Revenue',
      align: 'right',
      minWidth: 130,
      format: (value, _row) => {
        const percentage = totals.revenue > 0 ? ((value as number) / totals.revenue) * 100 : 0;
        return (
          <Box>
            <FormattedCurrency value={value as number} />
            <Typography variant="caption" display="block" color="text.secondary">
              {percentage.toFixed(1)}%
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'profit',
      label: 'Profit',
      align: 'right',
      minWidth: 130,
      format: (value, row) => (
        <Box>
          <FormattedCurrency value={value as number} />
          <Typography variant="caption" display="block" color="text.secondary">
            {row?.profitMargin.toFixed(1)}% margin
          </Typography>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mergedData.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Box textAlign="center">
          <Box color="text.secondary" mb={2}>
            No category data available
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={2}>
        <TextField
          placeholder="Search categories..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <DataTable
        columns={columns}
        data={filteredData}
        defaultSortColumn="totalOrders"
        defaultSortDirection="desc"
        getRowId={(row) => row.categoryId}
        rowsPerPageOptions={[10, 25, 50]}
        defaultRowsPerPage={25}
        renderCollapse={(row) => (
          <CategoryProductsList
            categoryName={row.categoryName}
            products={getProductsForCategory(row.categoryName)}
            categories={categories}
            isOpen={true}
          />
        )}
      />
    </Box>
  );
};

export default MergedCategoryTable; 