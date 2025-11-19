import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import { MobileModal } from '../../../../components/mobile/MobileModal';
import {
  FlipkartReturnStatus,
  FlipkartReturnReasonCategory,
  FlipkartQCStatus,
} from '../../../../types/flipkartReturns.type';

export interface MobileReturnFiltersProps {
  open: boolean;
  onClose: () => void;
  statusFilter: FlipkartReturnStatus[];
  reasonFilter: FlipkartReturnReasonCategory[];
  qcFilter: FlipkartQCStatus[];
  resaleableOnly: boolean;
  onApply: (filters: {
    status: FlipkartReturnStatus[];
    reason: FlipkartReturnReasonCategory[];
    qc: FlipkartQCStatus[];
    resaleableOnly: boolean;
  }) => void;
  onClear: () => void;
}

/**
 * Mobile-optimized filter bottom sheet for Flipkart Returns
 *
 * Provides touch-friendly checkboxes for:
 * - Return status (multiple selection)
 * - Return reason category (multiple selection)
 * - QC status (multiple selection)
 * - Resaleable only toggle
 */
export const MobileReturnFilters: React.FC<MobileReturnFiltersProps> = ({
  open,
  onClose,
  statusFilter,
  reasonFilter,
  qcFilter,
  resaleableOnly,
  onApply,
  onClear,
}) => {
  const [localStatus, setLocalStatus] = useState<FlipkartReturnStatus[]>(statusFilter);
  const [localReason, setLocalReason] = useState<FlipkartReturnReasonCategory[]>(reasonFilter);
  const [localQC, setLocalQC] = useState<FlipkartQCStatus[]>(qcFilter);
  const [localResaleable, setLocalResaleable] = useState(resaleableOnly);

  // Sync local state when filters change from parent
  React.useEffect(() => {
    setLocalStatus(statusFilter);
    setLocalReason(reasonFilter);
    setLocalQC(qcFilter);
    setLocalResaleable(resaleableOnly);
  }, [statusFilter, reasonFilter, qcFilter, resaleableOnly]);

  const handleApply = () => {
    onApply({
      status: localStatus,
      reason: localReason,
      qc: localQC,
      resaleableOnly: localResaleable,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalStatus([]);
    setLocalReason([]);
    setLocalQC([]);
    setLocalResaleable(false);
    onClear();
    onClose();
  };

  const handleStatusToggle = (status: FlipkartReturnStatus) => {
    setLocalStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleReasonToggle = (reason: FlipkartReturnReasonCategory) => {
    setLocalReason((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleQCToggle = (qc: FlipkartQCStatus) => {
    setLocalQC((prev) =>
      prev.includes(qc)
        ? prev.filter((q) => q !== qc)
        : [...prev, qc]
    );
  };

  return (
    <MobileModal
      open={open}
      onClose={onClose}
      title="Filter Returns"
    >
      <Box sx={{ pb: 2, px: 2 }}>
        {/* Action buttons at top */}
        <Stack direction="row" spacing={2} sx={{ width: '100%', mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClear}
            fullWidth
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            fullWidth
          >
            Apply Filters
          </Button>
        </Stack>
        {/* Return Status */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
            Return Status
          </FormLabel>
          <FormGroup>
            {Object.values(FlipkartReturnStatus).map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={localStatus.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                  />
                }
                label={status}
                sx={{ minHeight: 48 }}
              />
            ))}
          </FormGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Return Reason */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
            Return Reason
          </FormLabel>
          <FormGroup>
            {Object.values(FlipkartReturnReasonCategory).map((reason) => (
              <FormControlLabel
                key={reason}
                control={
                  <Checkbox
                    checked={localReason.includes(reason)}
                    onChange={() => handleReasonToggle(reason)}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                  />
                }
                label={reason}
                sx={{ minHeight: 48 }}
              />
            ))}
          </FormGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* QC Status */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
            QC Status
          </FormLabel>
          <FormGroup>
            {Object.values(FlipkartQCStatus).map((qc) => (
              <FormControlLabel
                key={qc}
                control={
                  <Checkbox
                    checked={localQC.includes(qc)}
                    onChange={() => handleQCToggle(qc)}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                  />
                }
                label={qc}
                sx={{ minHeight: 48 }}
              />
            ))}
          </FormGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Resaleable Only */}
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
            Additional Filters
          </FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localResaleable}
                  onChange={(e) => setLocalResaleable(e.target.checked)}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                />
              }
              label="Resaleable Only"
              sx={{ minHeight: 48 }}
            />
          </FormGroup>
        </FormControl>
      </Box>
    </MobileModal>
  );
};

export default MobileReturnFilters;
