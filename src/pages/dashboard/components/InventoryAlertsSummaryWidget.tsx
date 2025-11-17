import React from 'react';
import InventoryAlertsWidget from './InventoryAlertsWidget';

interface InventoryAlertsSummaryWidgetProps {
  maxAlertsInWidget?: number;
}

/**
 * Inventory Alerts Summary Widget for Dashboard
 *
 * This is a simple wrapper around the existing InventoryAlertsWidget component
 * that was previously removed from the dashboard. We're adding it back with
 * a simplified interface focused on displaying critical inventory alerts.
 */
const InventoryAlertsSummaryWidget: React.FC<InventoryAlertsSummaryWidgetProps> = ({
  maxAlertsInWidget = 5,
}) => {
  return (
    <InventoryAlertsWidget
      maxAlertsInWidget={maxAlertsInWidget}
      onManualAdjustment={(categoryGroupId) => {
        console.log('Manual adjustment for category group:', categoryGroupId);
      }}
      onViewCategoryGroup={(categoryGroupId) => {
        console.log('View category group:', categoryGroupId);
      }}
    />
  );
};

export default InventoryAlertsSummaryWidget;
