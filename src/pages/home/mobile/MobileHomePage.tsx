import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Snackbar,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  CloudUpload as CloudIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { MobileAppShell } from '../../../navigation/MobileAppShell';
import { MobileCard } from '../../../components/mobile/MobileCard';
import { MobileDatePicker } from '../../../components/mobile/MobileDatePicker';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  mergePDFs,
  addAmazonFile,
  addFlipkartFile,
  removeAmazonFile,
  removeFlipkartFile,
  clearAmazonFiles,
  clearFlipkartFiles,
  setSelectedDate,
  setEnableBarcodes,
} from '../../../store/slices/pdfMergerSlice';
import {
  fetchCategories,
  fetchProducts,
} from '../../../store/slices/productsSlice';
import { selectIsAuthenticated } from '../../../store/slices/authSlice';
import { MobileFileUpload } from './components/MobileFileUpload';
import { MobilePdfViewer } from './components/MobilePdfViewer';
import { MobileBarcodeToggle } from './components/MobileBarcodeToggle';
import {
  UploadResult,
  pdfStorageService,
  defaultStorageConfig,
} from '../../../services/pdfStorageService';
import { defaultSortConfig } from '../../../utils/pdfSorting';

export const MobileHomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    amazonFiles,
    flipkartFiles,
    finalPdf,
    summary,
    loading,
    error,
    selectedDate,
    enableBarcodes,
  } = useAppSelector((state) => state.pdfMerger);
  const { categories, items: products } = useAppSelector(
    (state) => state.products
  );
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Local state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined
  );

  // Pull to refresh functionality
  const { state: pullState, containerRef } = usePullToRefresh(
    async () => {
      await Promise.all([
        dispatch(fetchProducts({})).unwrap(),
        dispatch(fetchCategories()).unwrap(),
      ]);
    },
    { threshold: 80, enabled: true }
  );

  // Fetch products and categories on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (products.length === 0) {
        await dispatch(fetchProducts({})).unwrap();
      }
      if (categories.length === 0) {
        await dispatch(fetchCategories()).unwrap();
      }
    };

    loadInitialData().catch(console.error);
  }, [dispatch, products.length, categories.length]);

  // Auto-save PDF when it's generated
  useEffect(() => {
    if (
      !finalPdf ||
      isUploading ||
      uploadResult ||
      !isAuthenticated ||
      finalPdf === processedPdfUrl
    ) {
      return;
    }

    setProcessedPdfUrl(finalPdf);

    const autoSavePdf = async () => {
      try {
        if (!finalPdf) return;
        const response = await fetch(finalPdf);
        const pdfBlob = await response.blob();

        const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
        const filename = `sorted_labels_${timestamp}.pdf`;

        const autoSaveConfig = {
          ...defaultStorageConfig,
          expiryDays: 7,
          description: `Auto-saved PDF with ${summary.length} products across ${categories.filter((c) => !!c.name).length
            } categories`,
        };

        const result = await pdfStorageService.uploadPdfForDate(
          pdfBlob,
          filename,
          selectedDate,
          {
            categoryCount: categories.length,
            productCount: summary.length,
            sortConfig: defaultSortConfig,
            description: `Auto-saved PDF with ${summary.length
              } products across ${categories.filter((c) => !!c.name).length
              } categories`,
          },
          autoSaveConfig
        );

        if (result.success) {
          setUploadResult(result);
          setSuccessMessage('PDF saved to cloud successfully!');
        } else {
          console.error('Error auto-uploading PDF:', result.error);
          if (!result.error?.includes('authenticated')) {
            setErrorMessage(result.error || 'Failed to auto-save PDF');
          }
        }
      } catch (error) {
        console.error('Error auto-uploading PDF:', error);
        if (
          !(error instanceof Error && error.message.includes('authenticated'))
        ) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to auto-save PDF'
          );
        }
      }
    };

    setIsUploading(true);
    autoSavePdf().finally(() => {
      setIsUploading(false);
    });
  }, [
    finalPdf,
    isAuthenticated,
    processedPdfUrl,
    selectedDate,
  ]);

  const handleGeneratePdf = async () => {
    if (amazonFiles.length === 0 && flipkartFiles.length === 0) return;

    // Reset upload result and processed PDF when generating a new PDF
    setUploadResult(null);
    setProcessedPdfUrl(null);

    try {
      await dispatch(
        mergePDFs({
          amazonFiles,
          flipkartFiles,
          sortConfig: defaultSortConfig,
          selectedDate,
          enableBarcodes,
        })
      ).unwrap();

      // Clear input files after successful merge
      dispatch(clearAmazonFiles());
      dispatch(clearFlipkartFiles());

      setSuccessMessage('PDF generated successfully!');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to generate PDF. Please try again.');
    }
  };

  const handleAddAmazonFile = (file: File) => {
    dispatch(addAmazonFile(file));
    resetDownloadState();
  };

  const handleAddFlipkartFile = (file: File) => {
    dispatch(addFlipkartFile(file));
    resetDownloadState();
  };

  const handleRemoveAmazonFile = (index: number) => {
    dispatch(removeAmazonFile(index));
    resetDownloadState();
  };

  const handleRemoveFlipkartFile = (index: number) => {
    dispatch(removeFlipkartFile(index));
    resetDownloadState();
  };

  const handleClearAmazonFiles = () => {
    dispatch(clearAmazonFiles());
    resetDownloadState();
  };

  const handleClearFlipkartFiles = () => {
    dispatch(clearFlipkartFiles());
    resetDownloadState();
  };

  const resetDownloadState = () => {
    setUploadResult(null);
    setProcessedPdfUrl(null);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      dispatch(setSelectedDate(date));
    }
  };

  const handleBarcodeToggle = (enabled: boolean) => {
    dispatch(setEnableBarcodes(enabled));
  };

  const handleViewPdf = () => {
    setShowPdfViewer(true);
  };

  const totalFiles = amazonFiles.length + flipkartFiles.length;
  const hasFiles = totalFiles > 0;

  return (
    <MobileAppShell pageTitle="PDF Merger">
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

        {/* Date Selection Card */}
        <MobileCard sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Processing Date
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose the date for processing PDF files. Orders will be saved to
            this date.
          </Typography>
          <MobileDatePicker
            label="Processing Date"
            value={selectedDate}
            onChange={handleDateChange}
            minDate={new Date()}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Orders will be saved to {format(selectedDate, 'MMMM dd, yyyy')}
          </Typography>
        </MobileCard>

        {/* File Upload Card */}
        <MobileCard sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PdfIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Upload PDF Files
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload PDF files from Amazon and/or Flipkart. The tool will merge
            them into a unified PDF document.
          </Typography>

          {/* File Upload Section */}
          <MobileFileUpload
            amazonFiles={amazonFiles}
            flipkartFiles={flipkartFiles}
            onAmazonAdd={handleAddAmazonFile}
            onFlipkartAdd={handleAddFlipkartFile}
            onAmazonRemove={handleRemoveAmazonFile}
            onFlipkartRemove={handleRemoveFlipkartFile}
            onAmazonClear={handleClearAmazonFiles}
            onFlipkartClear={handleClearFlipkartFiles}
          />

          {/* Files Summary */}
          {hasFiles && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'primary.light',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {totalFiles} file{totalFiles !== 1 ? 's' : ''} selected
              </Typography>
              <Chip
                label={`${amazonFiles.length} Amazon | ${flipkartFiles.length} Flipkart`}
                size="small"
                color="primary"
              />
            </Box>
          )}

          {/* Barcode Toggle */}
          <Box sx={{ mt: 2 }}>
            <MobileBarcodeToggle
              enabled={enableBarcodes}
              onChange={handleBarcodeToggle}
              disabled={loading}
            />
          </Box>

          {/* Generate Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={!hasFiles || loading}
            onClick={handleGeneratePdf}
            startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            {loading ? 'Processing...' : 'Generate PDF'}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </MobileCard>

        {/* Success Card */}
        {finalPdf && (
          <MobileCard
            sx={{
              mb: 2,
              borderColor: 'success.main',
              backgroundColor: 'success.lightest',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  PDF Ready!
                </Typography>
              </Box>
              <Chip
                label={`${summary.length} Products`}
                color="success"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your PDF has been generated and saved to cloud storage.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleViewPdf}
                startIcon={<ViewIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                View PDF
              </Button>
              {uploadResult?.downloadUrl && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  component="a"
                  href={uploadResult.downloadUrl}
                  download
                  startIcon={<CloudIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Download
                </Button>
              )}
            </Box>

            {isUploading && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 2,
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Saving to cloud...
                </Typography>
              </Box>
            )}
          </MobileCard>
        )}

        {/* Helper Text */}
        {!hasFiles && (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <PdfIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">
              Upload Amazon or Flipkart PDF files to get started
            </Typography>
          </Box>
        )}

        {/* PDF Viewer Modal */}
        {finalPdf && (
          <MobilePdfViewer
            open={showPdfViewer}
            onClose={() => setShowPdfViewer(false)}
            pdfUrl={finalPdf}
          />
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(undefined)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSuccessMessage(undefined)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={6000}
          onClose={() => setErrorMessage(undefined)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setErrorMessage(undefined)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </MobileAppShell>
  );
};
