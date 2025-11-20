import React, { ChangeEvent, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as FileIcon,
} from '@mui/icons-material';

interface MobileFileUploadProps {
  amazonFiles: File[];
  flipkartFiles: File[];
  onAmazonAdd: (file: File) => void;
  onFlipkartAdd: (file: File) => void;
  onAmazonRemove: (index: number) => void;
  onFlipkartRemove: (index: number) => void;
  onAmazonClear: () => void;
  onFlipkartClear: () => void;
}

export const MobileFileUpload: React.FC<MobileFileUploadProps> = ({
  amazonFiles,
  flipkartFiles,
  onAmazonAdd,
  onFlipkartAdd,
  onAmazonRemove,
  onFlipkartRemove,
  onAmazonClear,
  onFlipkartClear,
}) => {
  const amazonInputRef = useRef<HTMLInputElement>(null);
  const flipkartInputRef = useRef<HTMLInputElement>(null);

  const handleAmazonChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        onAmazonAdd(files[i]);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleFlipkartChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        onFlipkartAdd(files[i]);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileList = (
    files: File[],
    onRemove: (index: number) => void,
    onClear: () => void,
    color: 'primary' | 'secondary'
  ) => {
    if (files.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </Typography>
          {files.length > 1 && (
            <Chip
              label="Clear All"
              size="small"
              color="error"
              variant="outlined"
              onClick={onClear}
              sx={{ height: 24 }}
            />
          )}
        </Box>

        <List dense sx={{ backgroundColor: 'background.paper', borderRadius: 1 }}>
          {files.map((file, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  py: 1,
                  px: 2,
                  minHeight: 48,
                }}
              >
                <FileIcon
                  sx={{ mr: 2, color: `${color}.main`, fontSize: 20 }}
                />
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onRemove(index)}
                    size="small"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Box>
      {/* Amazon Upload */}
      <Box sx={{ mb: 2 }}>
        <input
          ref={amazonInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleAmazonChange}
          style={{ display: 'none' }}
          id="amazon-file-input"
        />
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => amazonInputRef.current?.click()}
          startIcon={<UploadIcon />}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          Upload Amazon PDFs
        </Button>
        {renderFileList(
          amazonFiles,
          onAmazonRemove,
          onAmazonClear,
          'primary'
        )}
      </Box>

      {/* Flipkart Upload */}
      <Box>
        <input
          ref={flipkartInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFlipkartChange}
          style={{ display: 'none' }}
          id="flipkart-file-input"
        />
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={() => flipkartInputRef.current?.click()}
          startIcon={<UploadIcon />}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          Upload Flipkart PDFs
        </Button>
        {renderFileList(
          flipkartFiles,
          onFlipkartRemove,
          onFlipkartClear,
          'secondary'
        )}
      </Box>
    </Box>
  );
};
