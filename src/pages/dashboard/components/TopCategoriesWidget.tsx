import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Button,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Transaction } from '../../../types/transaction.type';
import { Product } from '../../../services/product.service';
import { Category } from '../../../types/category';

interface TopCategoriesWidgetProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
  loading: boolean;
  maxCategories?: number;
}

interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  percentage: number;
  color?: string;
}

const TopCategoriesWidget: React.FC<TopCategoriesWidgetProps> = ({
  transactions,
  products,
  categories,
  loading,
  maxCategories = 5,
}) => {
  // Compute category revenue aggregation
  const topCategories = React.useMemo(() => {
    if (!transactions.length || !products.length) {
      return [];
    }

    // Create a map of SKU to categoryId
    const skuToCategoryMap = new Map(
      products.map((product) => [product.sku, product.categoryId])
    );

    // Create a map of categoryId to category
    const categoryMap = new Map(
      categories.map((category) => [category.id!, category])
    );

    // Aggregate revenue by category
    const categoryRevenueMap = new Map<string, number>();

    transactions.forEach((transaction) => {
      // Only count sales transactions
      const isSale = [
        'order',
        'delivered',
        'in_transit',
        'return_cancelled',
      ].includes(transaction.type?.toLowerCase() || '');

      if (!isSale) return;

      const categoryId = skuToCategoryMap.get(transaction.sku);
      if (!categoryId) return;

      const revenue = transaction.sellingPrice * transaction.quantity;
      categoryRevenueMap.set(
        categoryId,
        (categoryRevenueMap.get(categoryId) || 0) + revenue
      );
    });

    // Calculate total revenue for percentages
    const totalRevenue = Array.from(categoryRevenueMap.values()).reduce(
      (sum, revenue) => sum + revenue,
      0
    );

    // Convert to array and sort by revenue
    const categoryRevenues: CategoryRevenue[] = Array.from(categoryRevenueMap.entries())
      .map(([categoryId, revenue]) => {
        const category = categoryMap.get(categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Unknown Category',
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
          color: category?.color,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, maxCategories);

    return categoryRevenues;
  }, [transactions, products, categories, maxCategories]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (topCategories.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
        <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Category Data
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Process orders to see top categories by revenue
        </Typography>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/home/"
          size="small"
        >
          Upload Invoices
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrendingIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
          Top Categories
        </Typography>
        <Chip
          label={topCategories.length}
          color="primary"
          size="small"
          sx={{ ml: 1 }}
        />
      </Box>

      <List dense sx={{ mb: 1 }}>
        {topCategories.map((category, index) => (
          <ListItem
            key={category.categoryId}
            sx={{
              mb: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              flexDirection: 'column',
              alignItems: 'flex-start',
              p: 1.5,
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`#${index + 1}`}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {category.categoryName}
                </Typography>
              </Box>
              <Chip
                label={`${category.percentage.toFixed(1)}%`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'success.light' }}
              />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 0.5 }}>
              ₹{category.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={category.percentage}
              sx={{
                width: '100%',
                height: 6,
                borderRadius: 1,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: category.color || 'primary.main',
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Action Button */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/categories/"
          size="small"
          fullWidth
          sx={{ fontSize: '0.75rem' }}
        >
          View All Categories
        </Button>
      </Box>

      {/* Summary Footer */}
      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Top {topCategories.length} categories by revenue
        </Typography>
      </Box>
    </Paper>
  );
};

export default TopCategoriesWidget;
