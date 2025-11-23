import StarIcon from '@mui/icons-material/Star';
import {
    Box,
    Chip,
    Grid,
    Typography,
    useTheme,
} from '@mui/material';
import React from 'react';
import { HistoricalCategoryData } from '../hooks/useHistoricalData';
import CategoryCard from './CategoryCard';

interface TopCategoriesSectionProps {
  topCategories: HistoricalCategoryData[];
  totalCategories: number;
}

const TopCategoriesSection: React.FC<TopCategoriesSectionProps> = ({
  topCategories,
  totalCategories,
}) => {
  const theme = useTheme();

  if (!topCategories.length) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="h6" color="text.secondary">
          No top performers data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <StarIcon sx={{ color: theme.palette.warning.main }} />
        <Typography variant="h6">
          Top 10 Categories
        </Typography>
        <Chip
          label={`${topCategories.length} of ${totalCategories} categories`}
          size="small"
          variant="outlined"
          color="primary"
        />
      </Box>

      <Grid container spacing={2}>
        {topCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={category.categoryId}>
            <CategoryCard category={category} rank={index + 1} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TopCategoriesSection; 