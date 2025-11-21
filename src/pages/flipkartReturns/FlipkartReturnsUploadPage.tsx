import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  uploadReturnsFile,
  resetUploadState,
  clearError,
  clearSuccessMessage,
} from '../../store/slices/flipkartReturnsSlice';
import { FlipkartReturn } from '../../types/flipkartReturns.type';
import { FlipkartReturnsFactory } from '../../services/flipkartReturns/FlipkartReturnsFactory';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../utils/mobile';
import { MobileFlipkartReturnsUploadPage } from './mobile/MobileFlipkartReturnsUploadPage';

/**
 * FlipkartReturnsUploadPage
 *
 * Allows users to upload Flipkart Returns Excel files.
 * Features:
 * - Drag & drop or click to upload
 * - Preview parsed data before saving
 * - Validation and duplicate detection
 * - Progress tracking
 * - Mobile-optimized version for small screens
 */
const FlipkartReturnsUploadPage: React.FC = () => {
  const isMobile = useIsMobile();

  // Render mobile version on mobile devices
  if (isMobile) {
    return <MobileFlipkartReturnsUploadPage />;
  }

  return <DesktopFlipkartReturnsUploadPage />;
};

const DesktopFlipkartReturnsUploadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { uploading, uploadProgress, error, successMessage, inventoryRestoration } = useAppSelector(
    (state) => state.flipkartReturns
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewReturns, setPreviewReturns] = useState<FlipkartReturn[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setPreviewReturns([]);
    setParseError(null);
    setIsPreviewing(true);

    try {
      // Parse file to preview data
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      if (!returns || returns.length === 0) {
        setParseError('No valid returns found in file. Please check the file format.');
        setIsPreviewing(false);
        return;
      }

      setPreviewReturns(returns);
      setIsPreviewing(false);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Failed to parse file. Please ensure it is a valid Flipkart Returns Excel file.'
      );
      setIsPreviewing(false);
    }
  }, []);

  /**
   * Handle file input change
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle drop
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await dispatch(uploadReturnsFile(selectedFile)).unwrap();
      // Clear preview after successful upload
      setSelectedFile(null);
      setPreviewReturns([]);
    } catch {
      // Error is handled by Redux state
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewReturns([]);
    setParseError(null);
    dispatch(resetUploadState());
  };

  /**
   * Clear messages
   */
  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearSuccess = () => {
    dispatch(clearSuccessMessage());
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/flipkart-returns')}
        >
          Back to List
        </Button>
        <Typography variant="h4">
          Upload Flipkart Returns
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload Flipkart Returns Excel file to import return data. The file should contain return information including Return ID, Order ID, SKU, and financial details.
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={handleClearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert severity="success" onClose={handleClearSuccess} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Inventory Restoration Details */}
      {inventoryRestoration && (inventoryRestoration.restored.length > 0 || inventoryRestoration.errors.length > 0 || inventoryRestoration.skipped.length > 0) && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Inventory Restoration Summary
          </Typography>

          {inventoryRestoration.restored.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                ✓ Restored to Inventory ({inventoryRestoration.restored.length} items)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Return ID</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Category Group</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryRestoration.restored.slice(0, 5).map((item) => (
                    <TableRow key={item.returnId}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.returnId}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell>{item.categoryGroupId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {inventoryRestoration.restored.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ... and {inventoryRestoration.restored.length - 5} more
                </Typography>
              )}
            </Box>
          )}

          {inventoryRestoration.skipped.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                ⚠ Skipped ({inventoryRestoration.skipped.length} items)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Return ID</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryRestoration.skipped.slice(0, 5).map((item) => (
                    <TableRow key={item.returnId}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.returnId}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {inventoryRestoration.skipped.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ... and {inventoryRestoration.skipped.length - 5} more
                </Typography>
              )}
            </Box>
          )}

          {inventoryRestoration.errors.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="error.main" gutterBottom>
                ✗ Failed ({inventoryRestoration.errors.length} items)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Return ID</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryRestoration.errors.slice(0, 5).map((item) => (
                    <TableRow key={item.returnId}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.returnId}</TableCell>
                      <TableCell>{item.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {inventoryRestoration.errors.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ... and {inventoryRestoration.errors.length - 5} more
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Parse Error Alert */}
      {parseError && (
        <Alert severity="error" onClose={() => setParseError(null)} sx={{ mb: 2 }}>
          {parseError}
        </Alert>
      )}

      {/* Upload Zone */}
      {!selectedFile && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileInputChange}
          />
          <label htmlFor="file-upload">
            <Box sx={{ cursor: 'pointer' }}>
              <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop or Click to Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: Excel (.xlsx, .xls)
              </Typography>
            </Box>
          </label>
        </Paper>
      )}

      {/* Preview Section */}
      {selectedFile && !isPreviewing && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body1">
                  <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Typography>
              </Box>
              <IconButton onClick={handleCancel} size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Paper>

          {previewReturns.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Preview ({previewReturns.length} returns)
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Return ID</TableCell>
                      <TableCell>Order ID</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Refund Amount</TableCell>
                      <TableCell align="right">Net Loss</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewReturns.slice(0, 10).map((returnItem) => (
                      <TableRow key={returnItem.returnId}>
                        <TableCell>{returnItem.returnId}</TableCell>
                        <TableCell>{returnItem.orderId}</TableCell>
                        <TableCell>{returnItem.sku}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {returnItem.productTitle}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={returnItem.returnReasonCategory}
                            size="small"
                            color={
                              returnItem.returnReasonCategory === 'Defective' ||
                              returnItem.returnReasonCategory === 'Quality Issue'
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={returnItem.returnStatus} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          ₹{returnItem.financials.refundAmount.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={returnItem.financials.netLoss > 0 ? 'error' : 'success'}
                          >
                            ₹{returnItem.financials.netLoss.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {previewReturns.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Showing first 10 of {previewReturns.length} returns
                </Typography>
              )}

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUpload}
                  disabled={uploading || previewReturns.length === 0}
                >
                  Upload {previewReturns.length} Returns
                </Button>
                <Button variant="outlined" onClick={handleCancel} disabled={uploading}>
                  Cancel
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Parsing Indicator */}
      {isPreviewing && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Parsing file...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FlipkartReturnsUploadPage;
