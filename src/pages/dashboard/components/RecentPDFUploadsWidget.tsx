import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Upload as UploadIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { pdfStorageService, UploadResult } from '../../../services/pdfStorageService';

interface RecentPDFUploadsWidgetProps {
  maxItems?: number;
}

const RecentPDFUploadsWidget: React.FC<RecentPDFUploadsWidgetProps> = ({
  maxItems = 5,
}) => {
  const [pdfs, setPdfs] = React.useState<UploadResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPDFs = async () => {
      setLoading(true);
      setError(null);
      try {
        const allPdfs = await pdfStorageService.listAllPdfs();

        // Sort by upload date descending and limit
        const sortedPdfs = allPdfs
          .sort((a, b) => b.metadata.uploadedAt - a.metadata.uploadedAt)
          .slice(0, maxItems);

        setPdfs(sortedPdfs);
      } catch (err) {
        console.error('Error fetching PDFs:', err);
        setError('Failed to load PDF uploads');
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, [maxItems]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
        <PdfIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          size="small"
        >
          Retry
        </Button>
      </Paper>
    );
  }

  if (pdfs.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
        <PdfIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No PDFs Uploaded Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Upload Amazon/Flipkart invoices to get started
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/home/"
          startIcon={<UploadIcon />}
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
        <PdfIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
          Recent PDF Uploads
        </Typography>
        <Chip
          label={pdfs.length}
          color="primary"
          size="small"
          sx={{ ml: 1 }}
        />
      </Box>

      <List dense sx={{ mb: 1 }}>
        {pdfs.map((pdf, index) => (
          <ListItem
            key={pdf.fileId || index}
            sx={{
              mb: 1,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ListItemText
              primary={
                <Typography variant="body2" noWrap title={pdf.metadata.originalFileName}>
                  {pdf.metadata.originalFileName.length > 35
                    ? `${pdf.metadata.originalFileName.substring(0, 35)}...`
                    : pdf.metadata.originalFileName}
                </Typography>
              }
              secondary={
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {pdf.metadata.stats?.productCount && (
                    <Chip
                      label={`${pdf.metadata.stats.productCount} products`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                      color="info"
                    />
                  )}
                  <Typography variant="caption" color="text.secondary" component="span">
                    {formatDistanceToNow(new Date(pdf.metadata.uploadedAt), { addSuffix: true })}
                  </Typography>
                </Stack>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Action Buttons */}
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          component={RouterLink}
          to="/home/"
          size="small"
          startIcon={<UploadIcon />}
          sx={{ fontSize: '0.75rem' }}
        >
          Upload New
        </Button>

        <Button
          variant="outlined"
          component={RouterLink}
          to="/storage-management/"
          size="small"
          startIcon={<FolderIcon />}
          sx={{ fontSize: '0.75rem' }}
        >
          View All Files
        </Button>
      </Stack>

      {/* Summary Footer */}
      {pdfs.length > 0 && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Showing {pdfs.length} most recent uploads
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RecentPDFUploadsWidget;
