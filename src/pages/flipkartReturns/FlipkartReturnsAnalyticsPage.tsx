import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingDown as LossIcon,
  Category as CategoryIcon,
  CheckCircle as ResaleableIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { format, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#D0ED57', '#A4DE6C', '#FCCB00'];

const FlipkartReturnsAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { returns, loading } = useAppSelector((state) => state.flipkartReturns);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalReturns = returns.length;
    const totalNetLoss = returns.reduce((sum, r) => sum + r.financials.netLoss, 0);
    const totalRefunded = returns.reduce((sum, r) => sum + r.financials.refundAmount, 0);
    const resaleableCount = returns.filter((r) => r.resaleable).length;
    const averageLoss = totalReturns > 0 ? totalNetLoss / totalReturns : 0;

    return {
      totalReturns,
      totalNetLoss,
      totalRefunded,
      resaleableCount,
      resaleablePercentage: totalReturns > 0 ? (resaleableCount / totalReturns) * 100 : 0,
      averageLoss,
    };
  }, [returns]);

  // Returns by category (for pie chart)
  const categoryData = useMemo(() => {
    const categoryCounts = returns.reduce((acc, r) => {
      const category = r.returnReasonCategory;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [returns]);

  // Loss by category (for bar chart)
  const categoryLossData = useMemo(() => {
    const categoryLosses = returns.reduce((acc, r) => {
      const category = r.returnReasonCategory;
      acc[category] = (acc[category] || 0) + r.financials.netLoss;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryLosses)
      .map(([category, loss]) => ({
        category: category.length > 15 ? category.substring(0, 15) + '...' : category,
        fullCategory: category,
        loss,
      }))
      .sort((a, b) => b.loss - a.loss)
      .slice(0, 10); // Top 10 categories
  }, [returns]);

  // Returns trend over time (monthly)
  const trendData = useMemo(() => {
    if (returns.length === 0) return [];

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    const monthlyData = months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthReturns = returns.filter((r) => {
        const returnDate = new Date(r.dates.returnInitiatedDate);
        return (
          returnDate.getFullYear() === monthStart.getFullYear() &&
          returnDate.getMonth() === monthStart.getMonth()
        );
      });

      const monthLoss = monthReturns.reduce((sum, r) => sum + r.financials.netLoss, 0);

      return {
        month: format(monthStart, 'MMM yyyy'),
        returns: monthReturns.length,
        loss: monthLoss,
      };
    });

    return monthlyData;
  }, [returns]);

  // Resaleable vs Non-resaleable (for pie chart)
  const resaleableData = [
    { name: 'Resaleable', value: metrics.resaleableCount },
    { name: 'Non-Resaleable', value: metrics.totalReturns - metrics.resaleableCount },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (returns.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/flipkart-returns')}
          sx={{ mb: 2 }}
        >
          Back to Returns
        </Button>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CategoryIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Returns Data Available
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Upload Flipkart returns to view analytics and insights
          </Typography>
          <Button variant="contained" onClick={() => navigate('/flipkart-returns/upload')}>
            Upload Returns
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/flipkart-returns')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Returns Analytics
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Returns
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {metrics.totalReturns}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LossIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Net Loss
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                ₹{metrics.totalNetLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ResaleableIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Resaleable
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {metrics.resaleablePercentage.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.resaleableCount} of {metrics.totalReturns}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LossIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Loss/Return
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                ₹{metrics.averageLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1: Trend + Category Distribution */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Returns Trend (Last 6 Months)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="returns"
                  stroke="#8884d8"
                  name="Returns Count"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="loss"
                  stroke="#ff7300"
                  name="Net Loss (₹)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Returns by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2: Loss by Category + Resaleable Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Loss by Category (Top 10)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryLossData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    'Net Loss',
                  ]}
                />
                <Bar dataKey="loss" fill="#ff7300" name="Net Loss" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resaleable Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resaleableData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#FF8042" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FlipkartReturnsAnalyticsPage;
