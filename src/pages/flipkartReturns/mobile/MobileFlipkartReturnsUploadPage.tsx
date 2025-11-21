import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MobileAppShell } from '../../../navigation/MobileAppShell';
import { MobileCard } from '../../../components/mobile/MobileCard';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  uploadReturnsFile,
  resetUploadState,
  clearError,
} from '../../../store/slices/flipkartReturnsSlice';
import { FlipkartReturn } from '../../../types/flipkartReturns.type';
import { FlipkartReturnsFactory } from '../../../services/flipkartReturns/FlipkartReturnsFactory';
import { getSafeAreaInsets } from '../../../utils/mobile';

/**
 * Mobile-optimized Flipkart Returns Upload Page
 *
 * Features:
 * - Touch-friendly file upload
 * - Preview parsed data
 * - Progress tracking
 * - Automatic inventory restoration option
 */
export const MobileFlipkartReturnsUploadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const safeAreaInsets = getSafeAreaInsets();

  const { uploading, uploadProgress, error, successMessage } = useAppSelector(
    (state) => state.flipkartReturns
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewReturns, setPreviewReturns] = useState<FlipkartReturn[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setPreviewReturns([]);
    setParseError(null);
    setIsParsing(true);

    try {
      const factory = new FlipkartReturnsFactory(file);
      const returns = await factory.process();

      if (!returns || returns.length === 0) {
        setParseError('No valid returns found in file');
        setIsParsing(false);
        return;
      }

      setPreviewReturns(returns);
      setIsParsing(false);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Failed to parse file'
      );
      setIsParsing(false);
    }
  }, []);

  /**
   * Trigger file input click
   */
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

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
   * Handle upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await dispatch(uploadReturnsFile(selectedFile)).unwrap();
      // Clear after successful upload
      setSelectedFile(null);
      setPreviewReturns([]);
    } catch {
      // Error is handled by Redux and shown in UI via error state
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

  return (
    <MobileAppShell
      pageTitle="Upload Returns"
      showBackButton
      onBackClick={() => navigate('/flipkart-returns')}
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          pt: 2,
          pb: `calc(${safeAreaInsets.bottom}px + 16px)`,
        }}
      >
        {/* Instructions */}
        {!selectedFile && !successMessage && (
          <MobileCard sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload a Flipkart Returns Excel file (.xlsx) to import return data.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The file should contain columns like return_id, order_item_id, sku, product_title, etc.
            </Typography>
          </MobileCard>
        )}

        {/* Error Alert */}
        {(error || parseError) && (
          <Alert
            severity="error"
            onClose={() => {
              dispatch(clearError());
              setParseError(null);
            }}
            sx={{ mb: 2 }}
          >
            {error || parseError}
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert
            severity="success"
            onClose={handleCancel}
            sx={{ mb: 2 }}
            icon={<SuccessIcon />}
          >
            {successMessage}
            <Button
              size="small"
              onClick={() => navigate('/flipkart-returns')}
              sx={{ mt: 1 }}
              fullWidth
              variant="outlined"
            >
              View Returns List
            </Button>
          </Alert>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* Upload Button (when no file selected) */}
        {!selectedFile && !successMessage && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSelectFileClick}
            startIcon={<UploadIcon />}
            sx={{ py: 2 }}
          >
            Select Excel File
          </Button>
        )}

        {/* Parsing Indicator */}
        {isParsing && (
          <MobileCard sx={{ mt: 2 }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2">Parsing file...</Typography>
              <LinearProgress sx={{ width: '100%' }} />
            </Stack>
          </MobileCard>
        )}

        {/* File Preview */}
        {selectedFile && !isParsing && previewReturns.length > 0 && !successMessage && (
          <>
            <MobileCard sx={{ mt: 2, mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FileIcon color="action" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Preview: {previewReturns.length} return{previewReturns.length !== 1 ? 's' : ''} found
              </Typography>
            </MobileCard>

            {/* Preview List */}
            <MobileCard sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                First 5 Returns
              </Typography>
              <List dense disablePadding>
                {previewReturns.slice(0, 5).map((returnItem, index) => (
                  <React.Fragment key={returnItem.returnId}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText
                        primary={returnItem.productTitle}
                        secondary={
                          <>
                            Return ID: {returnItem.returnId}
                            <br />
                            SKU: {returnItem.sku} • Qty: {returnItem.quantity}
                          </>
                        }
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </MobileCard>

            {/* Upload Progress */}
            {uploading && (
              <MobileCard sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </MobileCard>
            )}

            {/* Action Buttons */}
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleUpload}
                disabled={uploading}
                startIcon={<UploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload Returns'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </MobileAppShell>
  );
};

export default MobileFlipkartReturnsUploadPage;
