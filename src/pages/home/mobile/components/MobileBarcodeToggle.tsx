import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { QrCode as QrCodeIcon } from '@mui/icons-material';

interface MobileBarcodeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const MobileBarcodeToggle: React.FC<MobileBarcodeToggleProps> = ({
  enabled,
  onChange,
  disabled = false,
}) => {
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            color="primary"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCodeIcon sx={{ fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Enable Barcodes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Include barcodes in the generated PDF
              </Typography>
            </Box>
          </Box>
        }
        sx={{ m: 0, width: '100%' }}
      />
    </Box>
  );
};
