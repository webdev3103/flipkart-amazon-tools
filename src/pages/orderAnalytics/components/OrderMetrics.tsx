import { Grid, Paper, Typography, Box, Tooltip } from '@mui/material';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';

// Import necessary types
import { Category } from '../../../services/category.service';
import { Product } from '../../../services/product.service';
import { ProductSummary } from '../../home/services/base.transformer';
import { FlipkartReturn } from '../../../types/flipkartReturns.type';

// Define prop types for OrderMetrics
interface OrderMetricsProps {
  orders: ProductSummary[];
  returns?: FlipkartReturn[];
  products: Product[];
  categories: Category[];
}

const OrderMetrics: React.FC<OrderMetricsProps> = ({ orders, returns = [] }) => {

  // Order Metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    const price = order.product?.sellingPrice || 0;
    const quantity = parseInt(order.quantity) || 0;
    return sum + (price * quantity);
  }, 0);
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  // Return Metrics
  const totalReturns = returns.length;
  const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
  
  // Calculate total return value (refund amount)
  const totalReturnValue = returns.reduce((sum, returnItem) => {
    return sum + (returnItem.financials?.refundAmount || 0);
  }, 0);

  const netRevenue = totalRevenue - totalReturnValue;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Revenue Health */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%', background: 'transparent' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Revenue Health
            </Typography>
            <Tooltip title="Net Revenue = Total Revenue - Refunds">
              <InfoIcon fontSize="small" color="action" sx={{ opacity: 0.6 }} />
            </Tooltip>
          </Box>
          <Typography variant="h4" color="success.main" gutterBottom>
            ₹{netRevenue.toFixed(2)}
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Gross: ₹{totalRevenue.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="error.main">
              Refunds: -₹{totalReturnValue.toFixed(2)}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Order Volume */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%', background: 'transparent' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Order Volume
            </Typography>
          </Box>
          <Typography variant="h4" gutterBottom>
            {totalOrders}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalReturns} Returns ({returnRate.toFixed(1)}%)
          </Typography>
        </Paper>
      </Grid>

      {/* Return Impact */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%', background: 'transparent' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Return Impact
            </Typography>
            <Tooltip title="Percentage of orders returned">
              <InfoIcon fontSize="small" color="action" sx={{ opacity: 0.6 }} />
            </Tooltip>
          </Box>
          <Typography variant="h4" color={returnRate > 10 ? "error.main" : "text.primary"}>
            {returnRate.toFixed(1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            of total orders
          </Typography>
        </Paper>
      </Grid>

      {/* Average Value */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%', background: 'transparent' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Average Order Value
            </Typography>
          </Box>
          <Typography variant="h4">
            ₹{averageOrderValue.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gross Revenue / Total Orders
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OrderMetrics; 