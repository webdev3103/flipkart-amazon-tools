import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Paper,
  Divider,
  Chip,
  Alert,
  AlertTitle,
} from "@mui/material";
import React, { useEffect, Suspense, lazy } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import CategoryIcon from "@mui/icons-material/Category";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchProducts,
  updateProduct,
  setFilters,
  bulkUpdateProducts,
} from "../../store/slices/productsSlice";
import { selectIsAuthenticated } from "../../store/slices/authSlice";
import { Product } from "../../services/product.service";
import { ProductEditModal } from "../products/components/ProductEditModal";
import { UncategorizedProductTable } from "./components/UncategorizedProductTable";
import { useIsMobile } from "../../utils/mobile";
import { MobileAppShell } from "../../navigation/MobileAppShell";

export const UncategorizedProductsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const dispatch = useAppDispatch();
  const {
    items: allProducts,
    loading,
  } = useAppSelector((state) => state.products);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(
    null
  );

  // Filter products that don't have a category
  const uncategorizedProducts = React.useMemo(() => {
    return allProducts.filter(product => !product.categoryId || product.categoryId.trim() === '');
  }, [allProducts]);

  useEffect(() => {
    // Only fetch products if authenticated
    if (isAuthenticated) {
      dispatch(fetchProducts({}));
    }
  }, [dispatch, isAuthenticated]);  const handleProductUpdate = async (sku: string, data: Partial<Product>) => {
    try {
      await dispatch(updateProduct({ sku, data })).unwrap();
      setEditingProduct(null);
    } catch {
      // Error handling - could show toast notification
    }
  };

  const handleBulkCategoryUpdate = async (
    skus: string[],
    categoryId: string
  ) => {
    try {
      await dispatch(
        bulkUpdateProducts({ skus, data: { categoryId } })
      ).unwrap();
    } catch {
      // Error handling - could show toast notification
    }
  };

  const handleFilterChange = (filters: {
    platform?: string;
    search?: string;
  }) => {
    dispatch(setFilters(filters));
  };

  // Mobile wrapper
  if (isMobile) {
    return (
      <MobileAppShell pageTitle="Uncategorized">
        <Box sx={{ p: 2 }}>
          {uncategorizedProducts.length > 0 && (
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
              <Chip
                label={`${uncategorizedProducts.length} Products`}
                color="warning"
                size="medium"
              />
            </Box>
          )}

          {uncategorizedProducts.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Action Required</AlertTitle>
              {uncategorizedProducts.length} product(s) need categories.
            </Alert>
          )}

          <Paper sx={{ p: 2 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress color="warning" size={40} />
              </Box>
            ) : uncategorizedProducts.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={6}
              >
                <CategoryIcon sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "success.dark", mb: 1, textAlign: "center" }}>
                  All Products Categorized!
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Great job! All products have categories.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "warning.dark" }}>
                  Needs Categories
                </Typography>
                <UncategorizedProductTable
                  products={uncategorizedProducts}
                  onEdit={setEditingProduct}
                  onFilterChange={handleFilterChange}
                  onBulkCategoryUpdate={handleBulkCategoryUpdate}
                />
              </Box>
            )}
          </Paper>

          {editingProduct && (
            <ProductEditModal
              product={editingProduct}
              onClose={() => setEditingProduct(null)}
              onSave={handleProductUpdate}
            />
          )}
        </Box>
      </MobileAppShell>
    );
  }

  // Desktop version
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <WarningIcon
              sx={{ fontSize: 32, mr: 2, color: "warning.main" }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: "bold", color: "warning.dark" }}
            >
              Uncategorized Products
            </Typography>
            <Chip
              label={`${uncategorizedProducts.length} Products`}
              color="warning"
              size="medium"
              sx={{ ml: 2 }}
            />
          </Box>
        </Box>        {uncategorizedProducts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Action Required</AlertTitle>
            You have {uncategorizedProducts.length} product(s) without categories. 
            Products without categories may not appear in reports and analytics correctly. 
            Please assign categories to these products for better organization and tracking.
          </Alert>
        )}

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ width: "100%" }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              m={4}
            >
              <CircularProgress color="warning" size={40} thickness={4} />
            </Box>
          ) : uncategorizedProducts.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <CategoryIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "success.dark", mb: 1 }}
              >
                All Products Categorized!
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
              >
                Great job! All your products have been assigned to categories.
                This helps with better organization and reporting.
              </Typography>
            </Box>          ) : (
            <Box>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: "bold", color: "warning.dark" }}
              >
                Products Requiring Category Assignment
              </Typography>
              <UncategorizedProductTable
                products={uncategorizedProducts}
                onEdit={setEditingProduct}
                onFilterChange={handleFilterChange}
                onBulkCategoryUpdate={handleBulkCategoryUpdate}
              />
            </Box>
          )}
        </Box>

        {editingProduct && (
          <ProductEditModal
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSave={handleProductUpdate}
          />
        )}
      </Paper>
    </Container>
  );
};

export default UncategorizedProductsPage;