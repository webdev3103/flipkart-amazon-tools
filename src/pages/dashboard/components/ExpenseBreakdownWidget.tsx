import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MoneyOff as ExpenseIcon,
} from '@mui/icons-material';
import { Transaction } from '../../../types/transaction.type';

interface ExpenseBreakdownWidgetProps {
  transactions: Transaction[];
  loading: boolean;
}

interface ExpenseData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  shipping: '#2196f3',      // Blue
  marketplace: '#ff9800',   // Orange
  other: '#9e9e9e',         // Gray
};

const ExpenseBreakdownWidget: React.FC<ExpenseBreakdownWidgetProps> = ({
  transactions,
  loading,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for expense analysis
  const [expenseData, setExpenseData] = React.useState<ExpenseData[]>([]);
  const [totalExpenses, setTotalExpenses] = React.useState(0);
  const [analyzing, setAnalyzing] = React.useState(false);

  // Compute expense breakdown using TransactionAnalysisService
  React.useEffect(() => {
    if (!transactions.length) {
      setExpenseData([]);
      setTotalExpenses(0);
      return;
    }

    const analyzeExpenses = async () => {
      setAnalyzing(true);
      try {
        // Aggregate expenses by type
        let shippingTotal = 0;
        let marketplaceTotal = 0;
        let otherTotal = 0;

        transactions.forEach((transaction) => {
          if (transaction.expenses) {
            shippingTotal += transaction.expenses.shippingFee || 0;
            marketplaceTotal += transaction.expenses.marketplaceFee || 0;
            otherTotal += transaction.expenses.otherFees || 0;
          }
        });

        const total = shippingTotal + marketplaceTotal + otherTotal;

        const data: ExpenseData[] = [];
        if (shippingTotal > 0) {
          data.push({
            name: 'Shipping',
            value: shippingTotal,
            color: COLORS.shipping,
          });
        }
        if (marketplaceTotal > 0) {
          data.push({
            name: 'Marketplace Fees',
            value: marketplaceTotal,
            color: COLORS.marketplace,
          });
        }
        if (otherTotal > 0) {
          data.push({
            name: 'Other Fees',
            value: otherTotal,
            color: COLORS.other,
          });
        }

        setExpenseData(data);
        setTotalExpenses(total);
      } catch (error) {
        console.error('Error analyzing expenses:', error);
      } finally {
        setAnalyzing(false);
      }
    };

    analyzeExpenses();
  }, [transactions]);

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: ExpenseData }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalExpenses > 0 ? (data.value / totalExpenses) * 100 : 0;

      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1.5,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold" mb={0.5}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            ₹{data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {percentage.toFixed(1)}% of total
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (loading || analyzing) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (expenseData.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
        <ExpenseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Expense Data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Process orders to see expense breakdown
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ExpenseIcon sx={{ mr: 1, color: 'error.main' }} />
        <Typography variant="h6" component="h2" sx={{ color: 'error.dark', fontWeight: 'bold' }}>
          Expense Breakdown
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Total Expenses
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
          ₹{totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Typography>
      </Box>

      {/* Pie Chart */}
      <Box sx={{ height: isMobile ? 200 : 220, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 60 : 70}
              innerRadius={isMobile ? 30 : 35}
              paddingAngle={2}
              dataKey="value"
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Expense Summary */}
      <Box sx={{ mt: 2 }}>
        {expenseData.map((expense) => {
          const percentage = totalExpenses > 0 ? (expense.value / totalExpenses) * 100 : 0;
          return (
            <Box
              key={expense.name}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: expense.color,
                  }}
                />
                <Typography variant="caption" fontWeight="medium">
                  {expense.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ₹{expense.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
                <Chip
                  label={`${percentage.toFixed(0)}%`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Summary Footer */}
      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Based on {transactions.length} transactions
        </Typography>
      </Box>
    </Paper>
  );
};

export default ExpenseBreakdownWidget;
