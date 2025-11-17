import React, { useEffect } from 'react';
import {
    Box,
    CircularProgress,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    ShoppingCart as OrdersIcon,
    Inventory as ProductsIcon,
    AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { MobileAppShell } from '../../../navigation/MobileAppShell';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchOrderHistory } from '../../../store/slices/orderHistorySlice';
import { fetchOrders } from '../../../store/slices/ordersSlice';
import { fetchProducts } from '../../../store/slices/productsSlice';
import { selectIsAuthenticated } from '../../../store/slices/authSlice';
import { fetchTransactions } from '../../../store/slices/transactionsSlice';
import { fetchCategories } from '../../../store/slices/categoriesSlice';
import { ProductSummary } from '../../../pages/home/services/base.transformer';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import ProfitSummaryWidget from '../components/ProfitSummaryWidget';
import RecentPDFUploadsWidget from '../components/RecentPDFUploadsWidget';
import InventoryAlertsSummaryWidget from '../components/InventoryAlertsSummaryWidget';
import TopCategoriesWidget from '../components/TopCategoriesWidget';

export const MobileDashboardPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items: products, loading: productsLoading } = useAppSelector(state => state.products);
    const { items: orders } = useAppSelector(state => state.orders);
    const { items: transactions, loading: transactionsLoading } = useAppSelector(state => state.transactions);
    const { items: categories, loading: categoriesLoading } = useAppSelector(state => state.categories);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    const { state: pullState, containerRef } = usePullToRefresh(
        async () => {
            await Promise.all([
                dispatch(fetchProducts({})).unwrap(),
                dispatch(fetchOrders()).unwrap(),
                dispatch(fetchOrderHistory()).unwrap(),
                dispatch(fetchTransactions()).unwrap(),
                dispatch(fetchCategories()).unwrap(),
            ]);
        },
        { threshold: 80, enabled: true }
    );

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchProducts({}));
            dispatch(fetchOrders());
            dispatch(fetchOrderHistory());
            dispatch(fetchTransactions());
            dispatch(fetchCategories());
        }
    }, [dispatch, isAuthenticated]);

    const totalOrders = orders.length;
    const totalProducts = products.length;
    const revenue = orders.reduce((sum, order: ProductSummary) => {
        const price = order.product?.sellingPrice || 0;
        const quantity = parseInt(order.quantity) || 0;
        return sum + (price * quantity);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    const loading = productsLoading || transactionsLoading || categoriesLoading;

    if (loading) {
        return (
            <MobileAppShell pageTitle="Dashboard">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            </MobileAppShell>
        );
    }

    return (
        <MobileAppShell pageTitle="Dashboard">
            <Box
                ref={containerRef}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflow: 'auto',
                    backgroundColor: 'background.default',
                    width: '100%',
                }}
            >
                {pullState.isRefreshing && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                <Box sx={{ p: 2 }}>
                    {/* Date Header */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>

                    {/* Summary Cards - 2x2 Grid */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                            <Paper sx={{
                                p: 2,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderColor: 'primary.main',
                                minHeight: 120,
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <OrdersIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                                        {totalOrders}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Orders
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={6}>
                            <Paper sx={{
                                p: 2,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderColor: 'success.main',
                                minHeight: 120,
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <RevenueIcon sx={{ fontSize: 28, color: 'success.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                                        ₹{(revenue / 1000).toFixed(1)}k
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Revenue
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={6}>
                            <Paper sx={{
                                p: 2,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderColor: 'info.main',
                                minHeight: 120,
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <ProductsIcon sx={{ fontSize: 28, color: 'info.main' }} />
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                                        {totalProducts}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Products
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={6}>
                            <Paper sx={{
                                p: 2,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderColor: 'secondary.main',
                                minHeight: 120,
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <TrendingUpIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.dark' }}>
                                        ₹{(averageOrderValue / 1000).toFixed(1)}k
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Avg Order
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Profit Summary Widget */}
                    <Box sx={{ mb: 2 }}>
                        <ProfitSummaryWidget
                            transactions={transactions}
                            products={products}
                            loading={loading}
                        />
                    </Box>

                    {/* Inventory Alerts Widget */}
                    <Box sx={{ mb: 2 }}>
                        <InventoryAlertsSummaryWidget maxAlertsInWidget={3} />
                    </Box>

                    {/* Recent PDF Uploads Widget */}
                    <Box sx={{ mb: 2 }}>
                        <RecentPDFUploadsWidget maxItems={3} />
                    </Box>

                    {/* Top Categories Widget */}
                    <Box sx={{ mb: 2 }}>
                        <TopCategoriesWidget
                            transactions={transactions}
                            products={products}
                            categories={categories}
                            loading={loading}
                            maxCategories={3}
                        />
                    </Box>
                </Box>
            </Box>
        </MobileAppShell>
    );
};

export default MobileDashboardPage;
