import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface MobilePdfViewerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
}

export const MobilePdfViewer: React.FC<MobilePdfViewerProps> = ({
  open,
  onClose,
  pdfUrl,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          PDF Preview
        </Typography>
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>
          <Typography variant="body2">
            Tap and hold to save the PDF to your device, or use the share button
            in your browser.
          </Typography>
        </Alert>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            backgroundColor: '#525659',
          }}
        >
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flex: 1,
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No PDF available to preview
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
