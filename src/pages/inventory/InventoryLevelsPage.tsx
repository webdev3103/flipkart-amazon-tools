import { Inventory as InventoryIcon } from '@mui/icons-material';
import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import { InventoryLevelsList } from './components/InventoryLevelsList';
import { useIsMobile } from '../../utils/mobile';
import { MobileAppShell } from '../../navigation/MobileAppShell';

export const InventoryLevelsPage: React.FC = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileAppShell pageTitle="Inventory Levels">
        <Box sx={{ p: 2 }}>
          <Paper sx={{ p: 2 }}>
            <InventoryLevelsList />
          </Paper>
        </Box>
      </MobileAppShell>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <InventoryIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Inventory Levels
        </Typography>
      </Box>

      {/* Inventory Levels List */}
      <Paper sx={{ p: 2 }}>
        <InventoryLevelsList />
      </Paper>
    </Box>
  );
};

export default InventoryLevelsPage;