import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  TrendingUp as ProfitIcon,
  MoneyOff as ExpenseIcon,
  Percent as MarginIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Transaction } from '../../../types/transaction.type';
import { TransactionAnalysisService } from '../../../services/transactionAnalysis.service';
import { Product } from '../../../services/product.service';

interface ProfitSummaryWidgetProps {
  transactions: Transaction[];
  products: Product[];
  loading: boolean;
}

const ProfitSummaryWidget: React.FC<ProfitSummaryWidgetProps> = ({
  transactions,
  products,
  loading,
}) => {
  // State for profit analysis
  const [profitAnalysis, setProfitAnalysis] = React.useState({
    totalProfit: 0,
    totalExpenses: 0,
    totalSales: 0,
    profitMargin: 0,
  });
  const [analyzing, setAnalyzing] = React.useState(false);

  // Compute profit analysis using TransactionAnalysisService
  React.useEffect(() => {
    if (!transactions.length) {
      setProfitAnalysis({
        totalProfit: 0,
        totalExpenses: 0,
        totalSales: 0,
        profitMargin: 0,
      });
      return;
    }

    const analyzeTransactions = async () => {
      setAnalyzing(true);
      try {
        // Create product price map for the service
        const productPriceMap = new Map(
          products.map((product) => [
            product.sku,
            {
              sku: product.sku,
              name: product.name,
              basePrice: product.sellingPrice,
            },
          ])
        );

        // Analyze transactions
        const service = new TransactionAnalysisService(transactions, productPriceMap);
        const summary = await service.analyze();

        setProfitAnalysis({
          totalProfit: summary.totalProfit || 0,
          totalExpenses: summary.totalExpenses || 0,
          totalSales: summary.totalSales || 0,
          profitMargin:
            summary.totalSales > 0 ? (summary.totalProfit / summary.totalSales) * 100 : 0,
        });
      } catch (error) {
        console.error('Error analyzing transactions:', error);
      } finally {
        setAnalyzing(false);
      }
    };

    analyzeTransactions();
  }, [transactions, products]);

  if (loading || analyzing) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (!transactions.length) {
    return (
      <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
        <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Transaction Data
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Process orders to see profitability insights
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
        <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
          Profit Summary
        </Typography>
      </Box>

      <Stack spacing={2}>
        {/* Total Profit */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ProfitIcon sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Total Profit
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
            ₹{profitAnalysis.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
        </Box>

        <Divider />

        {/* Total Expenses */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ExpenseIcon sx={{ fontSize: 20, mr: 1, color: 'error.main' }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Total Expenses
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
            ₹{profitAnalysis.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
        </Box>

        <Divider />

        {/* Profit Margin */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <MarginIcon sx={{ fontSize: 20, mr: 1, color: 'info.main' }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Profit Margin
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
            {profitAnalysis.profitMargin.toFixed(1)}%
          </Typography>
        </Box>
      </Stack>

      {/* Action Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/order-analytics/"
          size="small"
          startIcon={<AnalyticsIcon />}
          fullWidth
        >
          View Analytics
        </Button>
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

export default ProfitSummaryWidget;
