import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
  Badge,
  Button,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { format, isWithinInterval } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchAllOrdersForAnalytics } from "../../store/slices/allOrdersForAnalyticsSlice";
import { fetchProducts } from "../../store/slices/productsSlice";
import { fetchCategories } from "../../store/slices/categoriesSlice";
import { fetchReturns } from "../../store/slices/flipkartReturnsSlice";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DateRangeFilter from "./components/DateRangeFilter";
import FilterPopover from "./components/FilterPopover";
import { useOrderFilters } from "./hooks/useOrderFilters";
import HistoricalDataTab from "./components/HistoricalDataTab";
import OverviewTab from "./components/OverviewTab";
import OrderMetrics from "./components/OrderMetrics";
import { useIsMobile } from "../../utils/mobile";
import { MobileAppShell } from "../../navigation/MobileAppShell";

const OrderAnalytics: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile();
  const {
    items: allOrders,
    loading: allOrdersLoading,
    error: allOrdersError,
  } = useSelector((state: RootState) => state.allOrdersForAnalytics);
  const {
    items: products,
    loading: productsLoading,
    error: productsError,
  } = useSelector((state: RootState) => state.products);
  const {
    items: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useSelector((state: RootState) => state.categories);
  const {
    returns,
    loading: returnsLoading,
    error: returnsError,
  } = useSelector((state: RootState) => state.flipkartReturns);

  // State for popovers
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);

  // Use custom hook for filters
  const {
    filterState,
    skuOptions,
    platformOptions,
    productOptions,
    filteredOrders,
    updateFilter,
    clearFilters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useOrderFilters({ allOrders: allOrders as any, categories, products });

  // Memoized loading and error states
  const isLoading = useMemo(() => 
    allOrdersLoading || productsLoading || categoriesLoading || returnsLoading, 
    [allOrdersLoading, productsLoading, categoriesLoading, returnsLoading]
  );
  
  const error = useMemo(() => 
    allOrdersError || productsError || categoriesError || returnsError, 
    [allOrdersError, productsError, categoriesError, returnsError]
  );

  // Fetch data on mount only
  useEffect(() => {
    const fetchData = async () => {
      const promises = [];

      if (allOrders.length === 0 && !allOrdersLoading && !allOrdersError) {
        promises.push(dispatch(fetchAllOrdersForAnalytics()));
      }
      if (products.length === 0 && !productsLoading && !productsError) {
        promises.push(dispatch(fetchProducts({})));
      }
      if (categories.length === 0 && !categoriesLoading && !categoriesError) {
        promises.push(dispatch(fetchCategories()));
      }
      if (returns.length === 0 && !returnsLoading && !returnsError) {
        promises.push(dispatch(fetchReturns()));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    fetchData();
  }, []); // Run once on mount

  // Memoized popover handlers
  const handleFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterAnchorEl(null);
  }, []);

  const handleDateClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  }, []);

  const handleDateClose = useCallback(() => {
    setDateAnchorEl(null);
  }, []);

  // Memoized active filter count
  const activeFilterCount = useMemo(() => [
    filterState.selectedCategory,
    filterState.selectedSku,
    filterState.selectedPlatform,
    filterState.selectedProduct,
  ].filter(Boolean).length, [filterState]);

  // Memoized date range summary
  const dateSummary = useMemo(() => 
    `${format(filterState.dateRange.startDate, "dd MMM yyyy")} - ${format(filterState.dateRange.endDate, "dd MMM yyyy")}`,
    [filterState.dateRange.startDate, filterState.dateRange.endDate]
  );

  // Filter returns based on the same criteria
  const filteredReturns = useMemo(() => {
    return returns.filter((returnItem) => {
      // Date filtering
      const returnDate = returnItem.dates.returnDeliveredDate
        || returnItem.dates.returnApprovedDate
        || returnItem.dates.returnInitiatedDate;
      
      const returnDateObj = new Date(returnDate);
      if (isNaN(returnDateObj.getTime())) return false;

      const isWithinDateRange = isWithinInterval(returnDateObj, {
        start: filterState.dateRange.startDate,
        end: filterState.dateRange.endDate
      });

      if (!isWithinDateRange) return false;

      // Category filtering
      // Note: Returns might not have categoryId directly populated or it might be different
      // We need to check if returnItem has categoryId or we need to look it up via SKU/Product
      // Assuming returnItem has categoryId or we can match via SKU
      
      // SKU filtering
      if (filterState.selectedSku && returnItem.sku !== filterState.selectedSku) {
        return false;
      }

      // Product filtering
      if (filterState.selectedProduct && returnItem.productTitle !== filterState.selectedProduct) {
        return false;
      }

      // Category filtering (if selected)
      if (filterState.selectedCategory) {
        // If return has categoryId, check it
        if (returnItem.categoryId) {
           const category = categories.find(c => c.id === returnItem.categoryId);
           if (category?.name !== filterState.selectedCategory) return false;
        } else {
          // Try to find product by SKU to get category
          const product = products.find(p => p.sku === returnItem.sku);
          if (product?.categoryId) {
             const category = categories.find(c => c.id === product.categoryId);
             if (category?.name !== filterState.selectedCategory) return false;
          } else {
             // If we can't determine category and category filter is active, exclude it?
             // Or include if 'Uncategorized'?
             if (filterState.selectedCategory !== 'Uncategorized') return false;
          }
        }
      }

      return true;
    });
  }, [returns, filterState, categories, products]);
  if (error) {
    const errorContent = (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Container>
    );

    if (isMobile) {
      return (
        <MobileAppShell pageTitle="Order Analytics">
          {errorContent}
        </MobileAppShell>
      );
    }
    return errorContent;
  }

  const content = (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth={false} sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 2 : 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Order Analytics</Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={handleDateClick}
              sx={{ textTransform: "none" }}
            >
              {dateSummary}
            </Button>
            <IconButton
              onClick={handleFilterClick}
              color={activeFilterCount > 0 ? "primary" : "default"}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={activeFilterCount} color="primary">
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        <DateRangeFilter
          dateRange={filterState.dateRange}
          onDateRangeChange={(startDate, endDate) =>
            updateFilter("dateRange", { startDate, endDate })
          }
          anchorEl={dateAnchorEl}
          onClose={handleDateClose}
        />

        <FilterPopover
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          categories={categories}
          selectedCategory={filterState.selectedCategory}
          selectedSku={filterState.selectedSku}
          selectedPlatform={filterState.selectedPlatform}
          selectedProduct={filterState.selectedProduct}
          skuOptions={skuOptions}
          platformOptions={platformOptions}
          productOptions={productOptions}
          onCategoryChange={(category) =>
            updateFilter("selectedCategory", category)
          }
          onSkuChange={(sku) => updateFilter("selectedSku", sku)}
          onPlatformChange={(platform) =>
            updateFilter("selectedPlatform", platform)
          }
          onProductChange={(product) =>
            updateFilter("selectedProduct", product)
          }
          onClearFilters={clearFilters}
        />

        {/* Order Metrics Section - Moved to top */}
        <OrderMetrics
          orders={filteredOrders}
          returns={filteredReturns}
          products={products}
          categories={categories}
        />

        {/* Category Analytics Section - Top 10 Categories */}
        <HistoricalDataTab
          orders={filteredOrders}
          products={products}
          categories={categories}
          filterState={filterState}
          onFilterUpdate={updateFilter}
          isLoading={isLoading}
        />
        
        {/* Overview Section */}
        <Box mt={4}>
          <OverviewTab
            orders={filteredOrders}
            products={products}
            categories={categories}
            filterState={filterState}
            onFilterUpdate={updateFilter}
            isLoading={isLoading}
          />
        </Box>
      </Container>
    </LocalizationProvider>
  );

  if (isMobile) {
    return (
      <MobileAppShell pageTitle="Order Analytics">
        {content}
      </MobileAppShell>
    );
  }

  return content;
};

export default OrderAnalytics;
