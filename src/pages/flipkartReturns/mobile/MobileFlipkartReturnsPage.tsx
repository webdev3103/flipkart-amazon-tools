import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Badge,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Upload as UploadIcon,
  Assessment as AnalyticsIcon,
  ArrowDownward as PullIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MobileAppShell } from '../../../navigation/MobileAppShell';
import { MobileFAB } from '../../../components/mobile/MobileFAB';
import { MobileReturnCard } from './components/MobileReturnCard';
import { MobileReturnFilters } from './components/MobileReturnFilters';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  fetchReturns,
  setFilters,
  clearFilters,
} from '../../../store/slices/flipkartReturnsSlice';
import { FlipkartReturn, FlipkartReturnStatus, FlipkartReturnReasonCategory, FlipkartQCStatus } from '../../../types/flipkartReturns.type';
import { usePullToRefresh, getPullToRefreshIndicatorStyle, getPullToRefreshRotation } from '../../../hooks/usePullToRefresh';
import { getSafeAreaInsets } from '../../../utils/mobile';
import ReturnDetailsModal from '../components/ReturnDetailsModal';
import { format } from 'date-fns';

/**
 * Mobile-optimized Flipkart Returns page
 *
 * Features:
 * - Search bar for quick filtering
 * - Filter button opens bottom sheet with status/reason/QC filters
 * - Returns count summary
 * - Pull-to-refresh to reload returns
 * - Card-based layout optimized for touch
 * - FAB for upload action
 * - Analytics and export quick actions
 *
 * @example
 * <Route path="/flipkart-returns" element={<MobileFlipkartReturnsPage />} />
 */
export const MobileFlipkartReturnsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const safeAreaInsets = getSafeAreaInsets();

  // Redux state
  const { filteredReturns, loading, error } = useAppSelector(
    (state) => state.flipkartReturns
  );

  // Local state
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlipkartReturnStatus[]>([]);
  const [reasonFilter, setReasonFilter] = useState<FlipkartReturnReasonCategory[]>([]);
  const [qcFilter, setQcFilter] = useState<FlipkartQCStatus[]>([]);
  const [resaleableOnly, setResaleableOnly] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<FlipkartReturn | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Pull-to-refresh
  const { state: pullState, containerRef } = usePullToRefresh(
    async () => {
      await dispatch(fetchReturns()).unwrap();
    },
    { threshold: 80, enabled: true }
  );

  // Calculate active filter count
  const activeFilters = [
    searchQuery !== '' ? 1 : 0,
    statusFilter.length > 0 ? 1 : 0,
    reasonFilter.length > 0 ? 1 : 0,
    qcFilter.length > 0 ? 1 : 0,
    resaleableOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Fetch returns on mount
  useEffect(() => {
    dispatch(fetchReturns());
  }, [dispatch]);

  /**
   * Handle filter application
   */
  const handleApplyFilters = (newFilters: {
    status: FlipkartReturnStatus[];
    reason: FlipkartReturnReasonCategory[];
    qc: FlipkartQCStatus[];
    resaleableOnly: boolean;
  }) => {
    setStatusFilter(newFilters.status);
    setReasonFilter(newFilters.reason);
    setQcFilter(newFilters.qc);
    setResaleableOnly(newFilters.resaleableOnly);

    dispatch(
      setFilters({
        searchQuery: searchQuery || undefined,
        status: newFilters.status.length > 0 ? newFilters.status : undefined,
        returnReasonCategory: newFilters.reason.length > 0 ? newFilters.reason : undefined,
        qcStatus: newFilters.qc.length > 0 ? newFilters.qc : undefined,
        resaleableOnly: newFilters.resaleableOnly || undefined,
      })
    );
  };

  /**
   * Handle clear all filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setReasonFilter([]);
    setQcFilter([]);
    setResaleableOnly(false);
    dispatch(clearFilters());
  };

  /**
   * Handle search query change
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    dispatch(
      setFilters({
        searchQuery: query || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        returnReasonCategory: reasonFilter.length > 0 ? reasonFilter : undefined,
        qcStatus: qcFilter.length > 0 ? qcFilter : undefined,
        resaleableOnly: resaleableOnly || undefined,
      })
    );
  };

  /**
   * Handle view return details
   */
  const handleViewReturn = (returnId: string) => {
    const returnItem = filteredReturns.find((r) => r.returnId === returnId);
    if (returnItem) {
      setSelectedReturn(returnItem);
      setDetailsModalOpen(true);
    }
  };

  /**
   * Handle export to CSV
   */
  const handleExport = () => {
    const headers = [
      'Return ID',
      'Order ID',
      'SKU',
      'Product Title',
      'Reason',
      'Status',
      'QC Status',
      'Refund Amount',
      'Net Loss',
      'Return Date',
      'Resaleable',
    ];

    const rows = filteredReturns.map((r) => [
      r.returnId,
      r.orderId,
      r.sku,
      r.productTitle,
      r.returnReasonCategory,
      r.returnStatus,
      r.qcStatus || '',
      r.financials.refundAmount,
      r.financials.netLoss,
      format(r.dates.returnInitiatedDate, 'yyyy-MM-dd'),
      r.resaleable ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `flipkart-returns-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MobileAppShell
      pageTitle="Returns"
      showBackButton={false}
      topBarActions={
        <>
          <IconButton
            color="inherit"
            onClick={() => navigate('/flipkart-returns/analytics')}
            disabled={filteredReturns.length === 0}
            aria-label="View analytics"
          >
            <AnalyticsIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleExport}
            disabled={filteredReturns.length === 0}
            aria-label="Export CSV"
          >
            <ExportIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setFilterOpen(true)}
            aria-label="Open filters"
          >
            <Badge badgeContent={activeFilters} color="error">
              <FilterIcon />
            </Badge>
          </IconButton>
        </>
      }
    >
      {/* Pull-to-refresh indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: safeAreaInsets.top,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
          pointerEvents: 'none',
          ...getPullToRefreshIndicatorStyle(pullState.pullDistance),
        }}
      >
        {pullState.pullDistance > 0 && (
          pullState.isPulling && !pullState.isRefreshing ? (
            <PullIcon
              sx={{
                fontSize: 32,
                color: 'primary.main',
                transform: `rotate(${getPullToRefreshRotation(pullState.progress, pullState.shouldRefresh)}deg)`,
                transition: 'transform 0.2s',
              }}
            />
          ) : (
            <CircularProgress size={32} />
          )
        )}
      </Box>

      {/* Main content container with pull-to-refresh */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          pt: 2,
          pb: `calc(${safeAreaInsets.bottom}px + 80px)`,
        }}
      >
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by Return ID, Order ID, SKU, or Product"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Returns Count Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredReturns.length} return{filteredReturns.length !== 1 ? 's' : ''}
            {activeFilters > 0 && ` (${activeFilters} filter${activeFilters !== 1 ? 's' : ''} active)`}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && filteredReturns.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && filteredReturns.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No returns found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeFilters > 0
                ? 'Try adjusting your filters'
                : 'Upload returns to get started'}
            </Typography>
          </Box>
        )}

        {/* Returns List */}
        {filteredReturns.map((returnItem) => (
          <MobileReturnCard
            key={returnItem.returnId}
            returnItem={returnItem}
            onView={handleViewReturn}
          />
        ))}
      </Box>

      {/* FAB for Upload */}
      <MobileFAB
        aria-label="Upload Returns"
        onClick={() => navigate('/flipkart-returns/upload')}
        color="primary"
      >
        <UploadIcon />
      </MobileFAB>

      {/* Filter Bottom Sheet */}
      <MobileReturnFilters
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        statusFilter={statusFilter}
        reasonFilter={reasonFilter}
        qcFilter={qcFilter}
        resaleableOnly={resaleableOnly}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Return Details Modal */}
      <ReturnDetailsModal
        open={detailsModalOpen}
        returnItem={selectedReturn}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedReturn(null);
        }}
      />
    </MobileAppShell>
  );
};

export default MobileFlipkartReturnsPage;
