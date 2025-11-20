import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  Category as CategoriesIcon,
  Inventory2 as InventoryIcon
} from '@mui/icons-material';
import { MobileTab } from '../types/mobile';
import { getSafeAreaInsets } from '../utils/mobile';
import { getBasePath } from '../utils/routing';

/**
 * Mobile bottom navigation component for primary app navigation
 * Displays bottom tabs for Home, Orders, Products, Categories, and Inventory
 * Uses Material-UI BottomNavigation with proper touch targets and safe areas
 *
 * @example
 * <MobileBottomNav />
 */
export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = getBasePath();

  // Define navigation tabs for mobile app with dynamic base path
  // Order matters: more specific routes should come first
  const tabs: MobileTab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon />,
      route: basePath === '' ? '/' : `${basePath}/`,
      disabled: false
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <OrdersIcon />,
      route: `${basePath}/todays-orders`,
      disabled: false
    },
    {
      id: 'products',
      label: 'Products',
      icon: <ProductsIcon />,
      route: `${basePath}/products/`,
      disabled: false
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <CategoriesIcon />,
      route: `${basePath}/categories/`,
      disabled: false
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <InventoryIcon />,
      route: `${basePath}/inventory`,
      disabled: false
    }
  ];

  // Determine active tab based on current route
  const getActiveTab = (): number => {
    const currentPath = location.pathname;

    // Exact match first (for home route)
    const exactIndex = tabs.findIndex(tab => currentPath === tab.route || currentPath === tab.route.replace(/\/$/, ''));
    if (exactIndex >= 0) return exactIndex;

    // Then check if currentPath starts with any tab route
    // Sort by route length (longest first) to match most specific routes first
    const sortedTabs = [...tabs].sort((a, b) => b.route.length - a.route.length);
    for (let i = 0; i < sortedTabs.length; i++) {
      const tab = sortedTabs[i];
      if (currentPath.startsWith(tab.route) || currentPath.startsWith(tab.route.replace(/\/$/, ''))) {
        return tabs.findIndex(t => t.id === tab.id);
      }
    }

    // Default to home
    return 0;
  };

  const [value, setValue] = React.useState(getActiveTab());

  // Update active tab when route changes
  React.useEffect(() => {
    const currentPath = location.pathname;

    // Exact match first (for home route)
    const exactIndex = tabs.findIndex(tab => currentPath === tab.route || currentPath === tab.route.replace(/\/$/, ''));
    if (exactIndex >= 0) {
      setValue(exactIndex);
      return;
    }

    // Then check if currentPath starts with any tab route
    // Sort by route length (longest first) to match most specific routes first
    const sortedTabs = [...tabs].sort((a, b) => b.route.length - a.route.length);
    for (let i = 0; i < sortedTabs.length; i++) {
      const tab = sortedTabs[i];
      if (currentPath.startsWith(tab.route) || currentPath.startsWith(tab.route.replace(/\/$/, ''))) {
        const tabIndex = tabs.findIndex(t => t.id === tab.id);
        setValue(tabIndex);
        return;
      }
    }

    // Default to home
    setValue(0);
  }, [location.pathname, tabs]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const selectedTab = tabs[newValue];
    if (selectedTab && !selectedTab.disabled) {
      navigate(selectedTab.route);
    }
  };

  const safeAreaInsets = getSafeAreaInsets();

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100, // Above content, below modals
        paddingBottom: safeAreaInsets.bottom, // iOS safe area
        boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)'
      }}
      elevation={3}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64, // Minimum height for touch targets
          '& .MuiBottomNavigationAction-root': {
            minWidth: 80,
            maxWidth: 168,
            padding: '6px 12px 8px',
            '&.Mui-selected': {
              paddingTop: '6px',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.5rem', // 24px icon size
          }
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction
            key={tab.id}
            label={tab.label}
            icon={
              tab.badge && tab.badge > 0 ? (
                <Badge badgeContent={tab.badge} color="error">
                  {tab.icon}
                </Badge>
              ) : (
                tab.icon
              )
            }
            disabled={tab.disabled}
            sx={{
              // Ensure minimum 44x44px touch target (iOS Human Interface Guidelines)
              minHeight: 44,
              '& .MuiTouchRipple-root': {
                // Ripple effect for touch feedback
                color: 'primary.main',
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
