import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  TrendingDown as LossIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { MobileCard } from '../../../../components/mobile/MobileCard';
import {
  FlipkartReturn,
  FlipkartReturnReasonCategory,
  FlipkartReturnStatus
} from '../../../../types/flipkartReturns.type';
import { format } from 'date-fns';

export interface MobileReturnCardProps {
  returnItem: FlipkartReturn;
  onView: (returnId: string) => void;
}

/**
 * Mobile-optimized return card component
 *
 * Displays key return information in a compact, touch-friendly format:
 * - Return ID and Order ID
 * - Product title (truncated)
 * - Return reason with color-coded chip
 * - Net loss prominently displayed
 * - Resaleable status indicator
 * - View details button
 */
export const MobileReturnCard: React.FC<MobileReturnCardProps> = ({
  returnItem,
  onView,
}) => {
  const getReasonColor = (): 'default' | 'error' | 'warning' => {
    const reason = returnItem.returnReasonCategory;
    if (reason === FlipkartReturnReasonCategory.DEFECTIVE || reason === FlipkartReturnReasonCategory.QUALITY_ISSUE) {
      return 'error';
    }
    if (reason === FlipkartReturnReasonCategory.DAMAGED || reason === FlipkartReturnReasonCategory.WRONG_ITEM) {
      return 'warning';
    }
    return 'default';
  };

  const getStatusColor = (): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    const status = returnItem.returnStatus;
    if (status === FlipkartReturnStatus.REFUNDED) {
      return 'success';
    }
    if (status === FlipkartReturnStatus.REJECTED || status === FlipkartReturnStatus.CANCELLED) {
      return 'error';
    }
    if (status === FlipkartReturnStatus.APPROVED || status === FlipkartReturnStatus.QC_COMPLETED) {
      return 'primary';
    }
    return 'default';
  };

  return (
    <MobileCard
      contentPadding={2}
      sx={{
        mb: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        '&:active': {
          bgcolor: 'action.selected',
        },
      }}
    >
      <Box>
        {/* Header: Return ID and Resaleable indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              {returnItem.returnId}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Order: {returnItem.orderId}
            </Typography>
          </Box>
          {returnItem.resaleable && (
            <Chip
              icon={<CheckIcon />}
              label="Resaleable"
              size="small"
              color="success"
              sx={{ ml: 1, height: 24, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Product Info */}
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {returnItem.productTitle}
        </Typography>

        {/* SKU and Quantity */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            SKU: <strong>{returnItem.sku}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Qty: <strong>{returnItem.quantity}</strong>
          </Typography>
        </Box>

        {/* Chips row: Reason and Status */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label={returnItem.returnReasonCategory}
            size="small"
            color={getReasonColor()}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          <Chip
            label={returnItem.returnStatus}
            size="small"
            color={getStatusColor()}
            variant="outlined"
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
        </Stack>

        {/* Bottom row: Net Loss and Action */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LossIcon sx={{ fontSize: 16, color: 'error.main' }} />
            <Typography variant="body2" fontWeight="bold" color="error.main">
              ₹{returnItem.financials.netLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {format(returnItem.dates.returnInitiatedDate, 'dd MMM yy')}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onView(returnItem.returnId)}
              sx={{
                minWidth: 40,
                minHeight: 40,
              }}
              aria-label={`View details for return ${returnItem.returnId}`}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </MobileCard>
  );
};

export default MobileReturnCard;
