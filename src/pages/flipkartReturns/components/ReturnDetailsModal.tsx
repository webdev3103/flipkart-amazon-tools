import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { FlipkartReturn } from '../../../types/flipkartReturns.type';
import { format } from 'date-fns';

interface ReturnDetailsModalProps {
  open: boolean;
  returnItem: FlipkartReturn | null;
  onClose: () => void;
}

/**
 * ReturnDetailsModal
 *
 * Displays detailed information about a single return.
 * Features:
 * - Order and return information
 * - Timeline of return lifecycle
 * - Financial breakdown
 * - QC status and resaleable flag
 */
const ReturnDetailsModal: React.FC<ReturnDetailsModalProps> = ({ open, returnItem, onClose }) => {
  if (!returnItem) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Return Details</Typography>
          <Button onClick={onClose} startIcon={<CloseIcon />}>
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Order Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Order Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Return ID
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {returnItem.returnId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Order ID
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {returnItem.orderId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                SKU
              </Typography>
              <Typography variant="body1">{returnItem.sku}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                FSN
              </Typography>
              <Typography variant="body1">{returnItem.fsn}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Product Title
              </Typography>
              <Typography variant="body1">{returnItem.productTitle}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Quantity
              </Typography>
              <Typography variant="body1">{returnItem.quantity}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="body1">
                {format(returnItem.dates.orderDate, 'dd MMM yyyy')}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Return Details */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Return Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Return Reason
              </Typography>
              <Typography variant="body1">{returnItem.returnReason}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Reason Category
              </Typography>
              <Chip
                label={returnItem.returnReasonCategory}
                color={
                  returnItem.returnReasonCategory === 'Defective' ||
                  returnItem.returnReasonCategory === 'Quality Issue'
                    ? 'error'
                    : 'default'
                }
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Return Type
              </Typography>
              <Chip label={returnItem.returnType} />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Return Status
              </Typography>
              <Chip
                label={returnItem.returnStatus}
                color={
                  returnItem.returnStatus === 'Refunded'
                    ? 'success'
                    : returnItem.returnStatus === 'Rejected'
                    ? 'error'
                    : 'primary'
                }
              />
            </Grid>
            {returnItem.qcStatus && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    QC Status
                  </Typography>
                  <Chip
                    label={returnItem.qcStatus}
                    color={returnItem.resaleable ? 'success' : 'default'}
                    icon={returnItem.resaleable ? <CheckCircleIcon /> : <ErrorIcon />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Resaleable
                  </Typography>
                  <Typography variant="body1" color={returnItem.resaleable ? 'success.main' : 'error.main'}>
                    {returnItem.resaleable ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Timeline */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Return Timeline
          </Typography>
          <Timeline>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="primary" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2" fontWeight="medium">
                  Return Initiated
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(returnItem.dates.returnInitiatedDate, 'dd MMM yyyy, HH:mm')}
                </Typography>
              </TimelineContent>
            </TimelineItem>

            {returnItem.dates.returnApprovedDate && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="success" />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body2" fontWeight="medium">
                    Return Approved
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(returnItem.dates.returnApprovedDate, 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}

            {returnItem.dates.pickupDate && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="info" />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body2" fontWeight="medium">
                    Picked Up
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(returnItem.dates.pickupDate, 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}

            {returnItem.dates.returnDeliveredDate && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="warning" />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body2" fontWeight="medium">
                    Delivered to Warehouse
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(returnItem.dates.returnDeliveredDate, 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}

            {returnItem.dates.refundProcessedDate && (
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="success" />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body2" fontWeight="medium">
                    Refund Processed
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(returnItem.dates.refundProcessedDate, 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}
          </Timeline>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Financial Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Financial Breakdown
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Table size="small">
              <TableBody>
                {/* Product Pricing */}
                {returnItem.pricing && (
                  <>
                    {returnItem.pricing.sellingPrice !== undefined && (
                      <TableRow>
                        <TableCell>Product Selling Price</TableCell>
                        <TableCell align="right">₹{returnItem.pricing.sellingPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    {returnItem.pricing.costPrice !== undefined && (
                      <TableRow>
                        <TableCell>Product Cost Price</TableCell>
                        <TableCell align="right">₹{returnItem.pricing.costPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    {returnItem.pricing.profitMargin !== undefined && (
                      <TableRow>
                        <TableCell>Product Profit Margin</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: returnItem.pricing.profitMargin >= 0 ? 'success.main' : 'error.main' }}
                        >
                          ₹{returnItem.pricing.profitMargin.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Divider sx={{ my: 1 }} />
                      </TableCell>
                    </TableRow>
                  </>
                )}
                <TableRow>
                  <TableCell>Refund Amount</TableCell>
                  <TableCell align="right">₹{returnItem.financials.refundAmount.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Reverse Pickup Charges</TableCell>
                  <TableCell align="right">₹{returnItem.financials.reversePickupCharges.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Commission Reversal</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>
                    -₹{returnItem.financials.commissionReversal.toFixed(2)}
                  </TableCell>
                </TableRow>
                {returnItem.financials.restockingFee > 0 && (
                  <TableRow>
                    <TableCell>Restocking Fee</TableCell>
                    <TableCell align="right">₹{returnItem.financials.restockingFee.toFixed(2)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>Settlement Amount</TableCell>
                  <TableCell align="right">₹{returnItem.financials.settlementAmount.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      Net Loss
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color={returnItem.financials.netLoss > 0 ? 'error' : 'success'}
                    >
                      ₹{returnItem.financials.netLoss.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Box>

        {/* Location Information */}
        {(returnItem.location?.returnLocation || returnItem.location?.warehouseLocation) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Location Information
              </Typography>
              <Grid container spacing={2}>
                {returnItem.location.returnLocation && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Return Location
                    </Typography>
                    <Typography variant="body1">{returnItem.location.returnLocation}</Typography>
                  </Grid>
                )}
                {returnItem.location.warehouseLocation && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Warehouse Location
                    </Typography>
                    <Typography variant="body1">{returnItem.location.warehouseLocation}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnDetailsModal;
