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
  TableSortLabel,
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
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchReturnsByDateRange,
  setFilters,
} from '../../store/slices/flipkartReturnsSlice';
import {
  FlipkartReturnStatus,
  FlipkartReturnReasonCategory,
  FlipkartQCStatus,
  FlipkartReturn,
  FlipkartReturnType,
} from '../../types/flipkartReturns.type';
import { format, startOfMonth, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ReturnDetailsModal from './components/ReturnDetailsModal';
import { MobileFlipkartReturnsPage } from './mobile/MobileFlipkartReturnsPage';
import DateRangeFilter from '../orderAnalytics/components/DateRangeFilter';

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
  const [returnTypeFilter, setReturnTypeFilter] = useState<FlipkartReturnType[]>([]);
  const [reasonFilter, setReasonFilter] = useState<FlipkartReturnReasonCategory[]>([]);
  const [qcFilter, setQcFilter] = useState<FlipkartQCStatus[]>([]);
  const [resaleableOnly, setResaleableOnly] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<FlipkartReturn | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: startOfMonth(new Date()),
    endDate: endOfDay(new Date()),
  });
  const [orderBy, setOrderBy] = useState<keyof FlipkartReturn | 'completionDate' | 'sellingPrice'>('returnId');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch returns by date range on mount (month-to-date default)
  useEffect(() => {
    const defaultStart = startOfMonth(new Date());
    const defaultEnd = endOfDay(new Date());

    dispatch(
      fetchReturnsByDateRange({
        startDate: defaultStart,
        endDate: defaultEnd,
      })
    ).then(() => {
      // After fetching, apply client-side filters including date priority
      dispatch(
        setFilters({
          dateRange: {
            start: defaultStart,
            end: defaultEnd,
          },
        })
      );
    });
  }, [dispatch]);

  /**
   * Handle search
   */
  const handleSearch = () => {
    dispatch(
      setFilters({
        searchQuery: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        returnType: returnTypeFilter.length > 0 ? returnTypeFilter : undefined,
        returnReasonCategory: reasonFilter.length > 0 ? reasonFilter : undefined,
        qcStatus: qcFilter.length > 0 ? qcFilter : undefined,
        resaleableOnly: resaleableOnly || undefined,
        dateRange: {
          start: dateRange.startDate,
          end: dateRange.endDate,
        },
      })
    );
    setPage(0);
  };

  /**
   * Handle date range change
   */
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  /**
   * Handle date filter click
   */
  const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  };

  /**
   * Handle date filter close
   */
  const handleDateClose = () => {
    setDateAnchorEl(null);
    // Refetch data with new date range
    dispatch(
      fetchReturnsByDateRange({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
    ).then(() => {
      // After fetching, apply client-side filters including date priority
      dispatch(
        setFilters({
          searchQuery: searchQuery || undefined,
          status: statusFilter.length > 0 ? statusFilter : undefined,
          returnType: returnTypeFilter.length > 0 ? returnTypeFilter : undefined,
          returnReasonCategory: reasonFilter.length > 0 ? reasonFilter : undefined,
          qcStatus: qcFilter.length > 0 ? qcFilter : undefined,
          resaleableOnly: resaleableOnly || undefined,
          dateRange: {
            start: dateRange.startDate,
            end: dateRange.endDate,
          },
        })
      );
    });
  };

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setReturnTypeFilter([]);
    setReasonFilter([]);
    setQcFilter([]);
    setResaleableOnly(false);
    const defaultDateRange = {
      startDate: startOfMonth(new Date()),
      endDate: endOfDay(new Date()),
    };
    setDateRange(defaultDateRange);
    // Refetch with default month-to-date range
    dispatch(
      fetchReturnsByDateRange({
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
      })
    ).then(() => {
      // After fetching, apply client-side filters including date priority
      dispatch(
        setFilters({
          dateRange: {
            start: defaultDateRange.startDate,
            end: defaultDateRange.endDate,
          },
        })
      );
    });
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
   * Handle return type filter change
   */
  const handleReturnTypeFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setReturnTypeFilter(typeof value === 'string' ? [] : (value as FlipkartReturnType[]));
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
      'Selling Price',
      'Reason',
      'Type',
      'Status',
      'Reverse Pickup Charges',
      'Commission Reversal',
      'Completion Date',
      'Resaleable',
    ];

    const rows = filteredReturns.map((r) => [
      r.returnId,
      r.orderId,
      r.sku,
      r.productTitle,
      r.pricing?.sellingPrice !== undefined ? r.pricing.sellingPrice : 'N/A',
      r.returnReasonCategory,
      r.returnType,
      r.returnStatus,
      r.financials.reversePickupCharges,
      r.financials.commissionReversal,
      r.dates.returnDeliveredDate ? format(r.dates.returnDeliveredDate, 'yyyy-MM-dd') : '-',
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
   * Handle sort request
   */
  const handleRequestSort = (property: keyof FlipkartReturn | 'completionDate' | 'sellingPrice') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  /**
   * Comparator function for sorting
   */
  const getComparator = (order: 'asc' | 'desc', orderBy: keyof FlipkartReturn | 'completionDate' | 'sellingPrice') => {
    return (a: FlipkartReturn, b: FlipkartReturn) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      if (orderBy === 'completionDate') {
        aValue = a.dates.returnDeliveredDate ? new Date(a.dates.returnDeliveredDate).getTime() : 0;
        bValue = b.dates.returnDeliveredDate ? new Date(b.dates.returnDeliveredDate).getTime() : 0;
      } else if (orderBy === 'sellingPrice') {
        aValue = a.pricing?.sellingPrice || 0;
        bValue = b.pricing?.sellingPrice || 0;
      } else {
        // Access nested properties safely
        const aObj = a as unknown as Record<string, string | number | Date>;
        const bObj = b as unknown as Record<string, string | number | Date>;
        aValue = aObj[orderBy] || '';
        bValue = bObj[orderBy] || '';
      }

      if (bValue < aValue) {
        return order === 'desc' ? -1 : 1;
      }
      if (bValue > aValue) {
        return order === 'desc' ? 1 : -1;
      }
      return 0;
    };
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

  // Sorted and paginated returns
  const sortedReturns = [...filteredReturns].sort(getComparator(order, orderBy));
  const paginatedReturns = sortedReturns.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Flipkart Returns</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={handleDateClick}
              sx={{ textTransform: 'none' }}
            >
              {format(dateRange.startDate, 'dd MMM yyyy')} - {format(dateRange.endDate, 'dd MMM yyyy')}
            </Button>
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

          {/* Return Type Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Return Type</InputLabel>
            <Select
              multiple
              value={returnTypeFilter}
              onChange={handleReturnTypeFilterChange}
              label="Return Type"
              renderValue={(selected) => `${selected.length} selected`}
            >
              {Object.values(FlipkartReturnType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
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
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'returnId'}
                      direction={orderBy === 'returnId' ? order : 'asc'}
                      onClick={() => handleRequestSort('returnId')}
                    >
                      Return ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'orderId'}
                      direction={orderBy === 'orderId' ? order : 'asc'}
                      onClick={() => handleRequestSort('orderId')}
                    >
                      Order ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'sku'}
                      direction={orderBy === 'sku' ? order : 'asc'}
                      onClick={() => handleRequestSort('sku')}
                    >
                      SKU
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'productTitle'}
                      direction={orderBy === 'productTitle' ? order : 'asc'}
                      onClick={() => handleRequestSort('productTitle')}
                    >
                      Product
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'sellingPrice'}
                      direction={orderBy === 'sellingPrice' ? order : 'asc'}
                      onClick={() => handleRequestSort('sellingPrice')}
                    >
                      Selling Price
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'returnReasonCategory'}
                      direction={orderBy === 'returnReasonCategory' ? order : 'asc'}
                      onClick={() => handleRequestSort('returnReasonCategory')}
                    >
                      Reason
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'returnStatus'}
                      direction={orderBy === 'returnStatus' ? order : 'asc'}
                      onClick={() => handleRequestSort('returnStatus')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'completionDate'}
                      direction={orderBy === 'completionDate' ? order : 'asc'}
                      onClick={() => handleRequestSort('completionDate')}
                    >
                      Completion Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
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
                      <TableCell align="right">
                        {returnItem.pricing?.sellingPrice !== undefined ? (
                          `₹${returnItem.pricing.sellingPrice.toFixed(2)}`
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
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
                        {returnItem.dates.returnDeliveredDate ? (
                          format(returnItem.dates.returnDeliveredDate, 'dd MMM yyyy')
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
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

      {/* Date Range Filter */}
      <DateRangeFilter
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        anchorEl={dateAnchorEl}
        onClose={handleDateClose}
      />
    </Box>
    </LocalizationProvider>
  );
};

export default FlipkartReturnsListPage;
