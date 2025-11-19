import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  PriceChange as PriceIcon,
  DateRange as DateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MobileAppShell } from '../../../navigation/MobileAppShell';
import { MobileCard } from '../../../components/mobile/MobileCard';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchProducts } from '../../../store/slices/productsSlice';
import {
  fetchTransactions,
  saveTransactions,
} from '../../../store/slices/transactionsSlice';
import { TransactionSummary } from '../../../types/transaction.type';
import { TransactionAnalysisService } from '../../../services/transactionAnalysis.service';
import OrderList from '../components/order-list.component';
import ProductList from '../components/product-list.component';
import SummaryTiles from '../components/summary-tiles.component';
import ReportExtractionFactory from '../services/ReportExtractionFactory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const MobileTransactionAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    items: transactions,
    loading,
    error,
  } = useAppSelector((state) => state.transactions);
  const { items: products } = useAppSelector((state) => state.products);

  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState<{
    minDate: Date | null;
    maxDate: Date | null;
  }>({
    minDate: null,
    maxDate: null,
  });
  const [analyzingPrices, setAnalyzingPrices] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Pull to refresh
  const { state: pullState, containerRef } = usePullToRefresh(
    async () => {
      await Promise.all([
        dispatch(fetchTransactions()).unwrap(),
        dispatch(fetchProducts({})).unwrap(),
      ]);
    },
    { threshold: 80, enabled: true }
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchTransactions()),
          dispatch(fetchProducts({})),
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, [dispatch]);

  // Analyze transactions when data changes
  useEffect(() => {
    const analyzeTransactions = async () => {
      if (transactions.length > 0 && products.length > 0) {
        try {
          setAnalyzingPrices(true);

          const priceMap = new Map(
            products.map((product) => [product.sku.toLowerCase(), product])
          );

          const transactionsWithPrices = transactions.map((transaction) => ({
            ...transaction,
            product: {
              ...transaction.product,
              ...priceMap.get(transaction.sku.toLowerCase()),
            },
          }));

          const dates = transactionsWithPrices.map(
            (transaction) => new Date(transaction.orderDate)
          );

          setDateRange({
            minDate: new Date(Math.min(...dates.map((date) => date.getTime()))),
            maxDate: new Date(Math.max(...dates.map((date) => date.getTime()))),
          });

          const transactionService = new TransactionAnalysisService(
            transactionsWithPrices,
            priceMap
          );

          const results = await transactionService.analyze();
          setSummary(results);
        } catch (error) {
          console.error('Error analyzing transactions:', error);
        } finally {
          setAnalyzingPrices(false);
        }
      }
    };

    analyzeTransactions();
  }, [transactions, products]);

  const availableProducts = useMemo(() => {
    if (!transactions.length) return [];
    const uniqueProducts = new Map<
      string,
      { sku: string; description: string }
    >();
    transactions.forEach((transaction) => {
      if (transaction.sku) {
        if (!uniqueProducts.has(transaction.sku)) {
          uniqueProducts.set(transaction.sku, {
            sku: transaction.sku,
            description: transaction.description || transaction.sku,
          });
        }
      }
    });
    return Array.from(uniqueProducts.values());
  }, [transactions]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploadError(null);
      const file = event.target.files?.[0];
      if (!file) throw new Error('No file selected');

      const newTransactions = await new ReportExtractionFactory(file).extract();
      await dispatch(saveTransactions(newTransactions)).unwrap();

      event.target.value = '';
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload file'
      );
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <MobileAppShell pageTitle="Analytics">
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'background.default',
          px: 2,
          py: 2,
        }}
      >
        {/* Pull to refresh indicator */}
        {pullState.isRefreshing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Transaction count chip */}
        {transactions.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Chip
              label={`${transactions.length} Transactions`}
              color="primary"
              size="medium"
            />
          </Box>
        )}

        {/* Loading indicator */}
        {(loading || analyzingPrices) && !pullState.isRefreshing && (
          <MobileCard sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="primary.main">
                {loading ? 'Loading...' : 'Analyzing prices...'}
              </Typography>
            </Box>
          </MobileCard>
        )}

        {/* Date Range Card */}
        <MobileCard
          sx={{
            mb: 2,
            borderColor: dateRange.minDate ? 'info.main' : 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <DateIcon sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dateRange.minDate ? 'Transaction Period' : 'No Data'}
            </Typography>
          </Box>
          {dateRange.minDate ? (
            <Typography variant="body2" color="text.secondary">
              {dateRange.minDate?.toLocaleDateString()} to{' '}
              {dateRange.maxDate?.toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Upload a transaction file to begin analysis
            </Typography>
          )}
        </MobileCard>

        {/* Action Buttons */}
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            component="label"
            disabled={loading}
            startIcon={<UploadIcon />}
            fullWidth
            sx={{
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 56,
            }}
          >
            Upload Transaction File
            <input
              type="file"
              hidden
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
            />
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/products')}
            disabled={!availableProducts.length}
            startIcon={<PriceIcon />}
            fullWidth
            sx={{
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 56,
            }}
          >
            Manage Product Prices
          </Button>
        </Box>

        {/* Errors */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
            {uploadError}
          </Alert>
        )}

        {/* Summary and Data */}
        {summary && (
          <>
            {/* Summary Tiles */}
            <Box sx={{ mb: 2 }}>
              <SummaryTiles summary={summary} />
            </Box>

            {/* Tabs */}
            <MobileCard sx={{ mb: 2, p: 0 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 48,
                  },
                }}
              >
                <Tab label="Orders" />
                <Tab label="Products" />
              </Tabs>

              <Box sx={{ px: 2 }}>
                <TabPanel value={tabValue} index={0}>
                  <OrderList transactions={summary?.analyzedTransactions || []} />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <ProductList transactions={transactions} summary={summary} />
                </TabPanel>
              </Box>
            </MobileCard>
          </>
        )}

        {/* Empty State */}
        {!summary && !loading && !analyzingPrices && (
          <MobileCard>
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
              }}
            >
              <UploadIcon
                sx={{ fontSize: 48, opacity: 0.3, mb: 2, color: 'text.secondary' }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No transaction data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a transaction file to view analytics
              </Typography>
            </Box>
          </MobileCard>
        )}
      </Box>
    </MobileAppShell>
  );
};
