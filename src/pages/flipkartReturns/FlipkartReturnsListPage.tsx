import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Upload as UploadIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchReturns,
  setFilters,
  clearFilters,
} from '../../store/slices/flipkartReturnsSlice';
import {
  FlipkartReturnStatus,
  FlipkartReturnReasonCategory,
  FlipkartQCStatus,
  FlipkartReturn,
} from '../../types/flipkartReturns.type';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ReturnDetailsModal from './components/ReturnDetailsModal';
import { MobileFlipkartReturnsPage } from './mobile/MobileFlipkartReturnsPage';

/**
 * FlipkartReturnsListPage
 *
 * Displays all Flipkart returns with filtering, search, and pagination.
 * Features:
 * - Table view with all return details
 * - Multi-filter support (status, reason, QC status)
 * - Search by Return ID, Order ID, SKU, Product
 * - Pagination
 * - Export to CSV
 */
const FlipkartReturnsListPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Render mobile version on small screens
  if (isMobile) {
    return <MobileFlipkartReturnsPage />;
  }

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { filteredReturns, loading, error, filters } = useAppSelector(
    (state) => state.flipkartReturns
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlipkartReturnStatus[]>([]);
  const [reasonFilter, setReasonFilter] = useState<FlipkartReturnReasonCategory[]>([]);
  const [qcFilter, setQcFilter] = useState<FlipkartQCStatus[]>([]);
  const [resaleableOnly, setResaleableOnly] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<FlipkartReturn | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch returns on mount
  useEffect(() => {
    dispatch(fetchReturns());
  }, [dispatch]);

  /**
   * Handle search
   */
  const handleSearch = () => {
    dispatch(
      setFilters({
        searchQuery: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        returnReasonCategory: reasonFilter.length > 0 ? reasonFilter : undefined,
        qcStatus: qcFilter.length > 0 ? qcFilter : undefined,
        resaleableOnly: resaleableOnly || undefined,
      })
    );
    setPage(0);
  };

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setReasonFilter([]);
    setQcFilter([]);
    setResaleableOnly(false);
    dispatch(clearFilters());
    setPage(0);
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setStatusFilter(typeof value === 'string' ? [] : (value as FlipkartReturnStatus[]));
  };

  /**
   * Handle reason filter change
   */
  const handleReasonFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setReasonFilter(typeof value === 'string' ? [] : (value as FlipkartReturnReasonCategory[]));
  };

  /**
   * Handle QC filter change
   */
  const handleQcFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setQcFilter(typeof value === 'string' ? [] : (value as FlipkartQCStatus[]));
  };

  /**
   * Handle page change
   */
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  /**
   * Handle rows per page change
   */
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
   * Handle close details modal
   */
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedReturn(null);
  };

  /**
   * Handle export to CSV
   */
  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Return ID',
      'Order ID',
      'SKU',
      'Product Title',
      'Reason',
      'Type',
      'Status',
      'QC Status',
      'Refund Amount',
      'Reverse Pickup Charges',
      'Commission Reversal',
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
      r.returnType,
      r.returnStatus,
      r.qcStatus || '',
      r.financials.refundAmount,
      r.financials.reversePickupCharges,
      r.financials.commissionReversal,
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

    // Download CSV
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

  /**
   * Get status chip color
   */
  const getStatusColor = (status: FlipkartReturnStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case FlipkartReturnStatus.REFUNDED:
        return 'success';
      case FlipkartReturnStatus.REJECTED:
      case FlipkartReturnStatus.CANCELLED:
        return 'error';
      case FlipkartReturnStatus.APPROVED:
      case FlipkartReturnStatus.QC_COMPLETED:
        return 'primary';
      default:
        return 'default';
    }
  };

  /**
   * Get reason chip color
   */
  const getReasonColor = (reason: FlipkartReturnReasonCategory): 'default' | 'error' | 'warning' => {
    if (reason === FlipkartReturnReasonCategory.DEFECTIVE || reason === FlipkartReturnReasonCategory.QUALITY_ISSUE) {
      return 'error';
    }
    if (reason === FlipkartReturnReasonCategory.DAMAGED || reason === FlipkartReturnReasonCategory.WRONG_ITEM) {
      return 'warning';
    }
    return 'default';
  };

  // Paginated returns
  const paginatedReturns = filteredReturns.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Flipkart Returns</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate('/flipkart-returns/analytics')}
            disabled={filteredReturns.length === 0}
          >
            Analytics
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => navigate('/flipkart-returns/upload')}
          >
            Upload Returns
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredReturns.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <TextField
            label="Search"
            placeholder="Return ID, Order ID, SKU, or Product"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              endAdornment: <SearchIcon />,
            }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              renderValue={(selected) => `${selected.length} selected`}
            >
              {Object.values(FlipkartReturnStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reason Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Reason</InputLabel>
            <Select
              multiple
              value={reasonFilter}
              onChange={handleReasonFilterChange}
              label="Reason"
              renderValue={(selected) => `${selected.length} selected`}
            >
              {Object.values(FlipkartReturnReasonCategory).map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* QC Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>QC Status</InputLabel>
            <Select
              multiple
              value={qcFilter}
              onChange={handleQcFilterChange}
              label="QC Status"
              renderValue={(selected) => `${selected.length} selected`}
            >
              {Object.values(FlipkartQCStatus).map((qc) => (
                <MenuItem key={qc} value={qc}>
                  {qc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Resaleable Only */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Resaleable</InputLabel>
            <Select
              value={resaleableOnly ? 'yes' : 'all'}
              onChange={(e) => setResaleableOnly(e.target.value === 'yes')}
              label="Resaleable"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="yes">Resaleable Only</MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Button variant="contained" onClick={handleSearch} startIcon={<FilterListIcon />}>
            Apply Filters
          </Button>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear
          </Button>
        </Box>

        {/* Active Filters Info */}
        {(filters.searchQuery || filters.status || filters.returnReasonCategory || filters.qcStatus || filters.resaleableOnly) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredReturns.length} of {filteredReturns.length} returns
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Returns Table */}
      {!loading && (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Return ID</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>QC Status</TableCell>
                  <TableCell align="right">Refund Amount</TableCell>
                  <TableCell align="right">Net Loss</TableCell>
                  <TableCell>Return Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No returns found. Try adjusting your filters or upload a returns file.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReturns.map((returnItem) => (
                    <TableRow key={returnItem.returnId} hover>
                      <TableCell>{returnItem.returnId}</TableCell>
                      <TableCell>{returnItem.orderId}</TableCell>
                      <TableCell>{returnItem.sku}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                          {returnItem.productTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={returnItem.returnReasonCategory}
                          size="small"
                          color={getReasonColor(returnItem.returnReasonCategory)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={returnItem.returnStatus}
                          size="small"
                          color={getStatusColor(returnItem.returnStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        {returnItem.qcStatus && (
                          <Chip
                            label={returnItem.qcStatus}
                            size="small"
                            color={returnItem.resaleable ? 'success' : 'default'}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        ₹{returnItem.financials.refundAmount.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={returnItem.financials.netLoss > 0 ? 'error' : 'success'}
                          fontWeight="medium"
                        >
                          ₹{returnItem.financials.netLoss.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(returnItem.dates.returnInitiatedDate, 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewReturn(returnItem.returnId)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredReturns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Return Details Modal */}
      <ReturnDetailsModal
        open={detailsModalOpen}
        returnItem={selectedReturn}
        onClose={handleCloseDetailsModal}
      />
    </Box>
  );
};

export default FlipkartReturnsListPage;
