import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InventoryIcon from '@mui/icons-material/Inventory';
import { HistoricalCategoryData } from '../hooks/useHistoricalData';

interface CategoryCardProps {
  category: HistoricalCategoryData;
  rank: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, rank }) => {
  const theme = useTheme();
  const isTop3 = rank <= 3;

  // Rank colors
  const getRankColor = (r: number) => {
    switch (r) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return theme.palette.grey[300];
    }
  };

  const rankColor = getRankColor(rank);
  const isPositiveTrend = category.orderChange >= 0;
  const trendColor = isPositiveTrend ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      {/* Rank Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          left: -10,
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: rankColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadows[2],
          zIndex: 1,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            color: isTop3 ? '#fff' : theme.palette.text.primary,
            textShadow: isTop3 ? '0px 1px 2px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {rank}
        </Typography>
      </Box>

      <CardContent sx={{ pt: 3, pb: '16px !important' }}>
        {/* Category Name */}
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          noWrap
          title={category.categoryName}
          sx={{ mb: 2, ml: 1 }}
        >
          {category.categoryName}
        </Typography>

        {/* Metrics Grid */}
        <Box display="flex" flexDirection="column" gap={1.5}>
          
          {/* Total Orders */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
              <ShoppingBagIcon fontSize="small" />
              <Typography variant="body2">Orders</Typography>
            </Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {category.totalOrders.toLocaleString()}
            </Typography>
          </Box>

          {/* Products Count */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
              <InventoryIcon fontSize="small" />
              <Typography variant="body2">Products</Typography>
            </Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {category.productCount.toLocaleString()}
            </Typography>
          </Box>

          {/* Trend Section */}
          <Box 
            sx={{ 
              mt: 1, 
              p: 1, 
              bgcolor: alpha(trendColor, 0.1), 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="caption" fontWeight="medium" color="text.secondary">
              vs Yesterday
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              {isPositiveTrend ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: trendColor }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: trendColor }} />
              )}
              <Typography 
                variant="caption" 
                fontWeight="bold" 
                sx={{ color: trendColor }}
              >
                {Math.abs(category.orderChange)} ({Math.abs(category.orderChangePercent).toFixed(1)}%)
              </Typography>
            </Box>
          </Box>

        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
