import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import {
  AssignmentReturn as ReturnsIcon,
  TrendingDown as LossIcon,
  Category as CategoryIcon,
  CheckCircle as ResaleableIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { FlipkartReturn } from '../../../types/flipkartReturns.type';

interface ReturnsWidgetProps {
  returns: FlipkartReturn[];
  loading: boolean;
}

const ReturnsWidget: React.FC<ReturnsWidgetProps> = ({
  returns,
  loading,
}) => {
  // Calculate metrics
  const totalReturns = returns.length;
  const totalNetLoss = returns.reduce((sum, r) => sum + r.financials.netLoss, 0);
  const resaleableCount = returns.filter((r) => r.resaleable).length;
  const resaleablePercentage = totalReturns > 0 ? (resaleableCount / totalReturns) * 100 : 0;

  // Get recent returns (last 5)
  const recentReturns = returns
    .sort((a, b) => new Date(b.dates.returnInitiatedDate).getTime() - new Date(a.dates.returnInitiatedDate).getTime())
    .slice(0, 5);

  // Get top loss category
  const categoryLosses = returns.reduce((acc, r) => {
    const category = r.returnReasonCategory;
    acc[category] = (acc[category] || 0) + r.financials.netLoss;
    return acc;
  }, {} as Record<string, number>);

  const topLossCategory = Object.entries(categoryLosses)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (!totalReturns) {
    return (
      <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
        <ReturnsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Returns Data
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Upload Flipkart returns to see insights
        </Typography>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/flipkart-returns/upload"
          size="small"
        >
          Upload Returns
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ReturnsIcon sx={{ mr: 1, color: 'warning.main' }} />
        <Typography variant="h6" component="h2" sx={{ color: 'warning.dark', fontWeight: 'bold' }}>
          Returns Overview
        </Typography>
      </Box>

      <Stack spacing={2}>
        {/* Total Net Loss */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <LossIcon sx={{ fontSize: 20, mr: 1, color: 'error.main' }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Total Net Loss
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
            ₹{totalNetLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
        </Box>

        <Divider />

        {/* Resaleable Returns */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ResaleableIcon sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Resaleable Returns
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
              {resaleableCount}
            </Typography>
            <Chip
              label={`${resaleablePercentage.toFixed(0)}%`}
              size="small"
              color="success"
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          </Box>
        </Box>

        <Divider />

        {/* Top Loss Category */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <CategoryIcon sx={{ fontSize: 20, mr: 1, color: 'info.main' }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Top Loss Reason
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'info.dark' }}>
            {topLossCategory}
          </Typography>
        </Box>
      </Stack>

      {/* Recent Returns */}
      {recentReturns.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight="medium" display="block" mb={1}>
            Recent Returns
          </Typography>
          <Stack spacing={0.5}>
            {recentReturns.slice(0, 3).map((returnItem) => (
              <Box
                key={returnItem.returnId}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 0.5,
                  borderRadius: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {returnItem.sku}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'medium',
                    color: returnItem.financials.netLoss > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  ₹{returnItem.financials.netLoss.toFixed(0)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Action Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/flipkart-returns"
          size="small"
          startIcon={<ReturnsIcon />}
          fullWidth
        >
          View All Returns
        </Button>
      </Box>

      {/* Summary Footer */}
      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {totalReturns} total returns
        </Typography>
      </Box>
    </Paper>
  );
};

export default ReturnsWidget;
