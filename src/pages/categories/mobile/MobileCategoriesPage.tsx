import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, IconButton, Button } from '@mui/material';
import { Upload as UploadIcon, Info as InfoIcon } from '@mui/icons-material';
import { MobileAppShell } from '../../../navigation/MobileAppShell';
import { MobileSearchInput } from '../../../components/mobile/MobileSearchInput';
import { MobileCategoryCard } from './components/MobileCategoryCard';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchCategories } from '../../../store/slices/categoriesSlice';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import { CategoryWithGroup } from '../../../types/category';
import CategoryImportModal from '../components/CategoryImportSection';

export const MobileCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const categories = useAppSelector(state => state.categories?.items || []);
  const loading = useAppSelector(state => state.categories?.loading || false);
  const error = useAppSelector(state => state.categories?.error || null);

  const [searchValue, setSearchValue] = useState('');
  const [displayCount, setDisplayCount] = useState(20);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { state: pullState, containerRef } = usePullToRefresh(
    async () => {
      await dispatch(fetchCategories()).unwrap();
    },
    { threshold: 80, enabled: true }
  );

  const filteredCategories = useMemo(() => {
    if (!searchValue) return categories;
    const search = searchValue.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.description && c.description.toLowerCase().includes(search))
    );
  }, [categories, searchValue]);

  const displayedCategories = filteredCategories.slice(0, displayCount);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: () => {
      if (displayCount < filteredCategories.length) {
        setDisplayCount(prev => Math.min(prev + 20, filteredCategories.length));
      }
    },
    isLoading: loading,
    hasMore: displayCount < filteredCategories.length,
    threshold: 100,
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryTap = (_category: CategoryWithGroup) => {
    // Categories should be managed on desktop - mobile is view-only
    // Could implement a details modal here if needed
  };

  const handleImportSuccess = () => {
    dispatch(fetchCategories());
    setImportModalOpen(false);
  };

  return (
    <MobileAppShell pageTitle="Categories">
      <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', backgroundColor: 'background.default', width: '100%' }}>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <MobileSearchInput value={searchValue} onChange={setSearchValue} placeholder="Search categories..." autoFocus={false} />
          </Box>
          <Box sx={{ px: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {filteredCategories.length} {filteredCategories.length === 1 ? 'Category' : 'Categories'}
            </Typography>
            <IconButton
              onClick={() => setImportModalOpen(true)}
              sx={{ minWidth: 44, minHeight: 44 }}
              aria-label="Import categories"
            >
              <UploadIcon />
            </IconButton>
          </Box>
        </Box>

        {pullState.isRefreshing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && !pullState.isRefreshing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && filteredCategories.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, p: 4, textAlign: 'center', gap: 2 }}>
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No categories found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchValue ? 'Try a different search term' : 'Import categories to get started'}
            </Typography>
            {!searchValue && (
              <Button
                variant="contained"
                onClick={() => setImportModalOpen(true)}
                startIcon={<UploadIcon />}
                sx={{ mt: 2 }}
              >
                Import Categories
              </Button>
            )}
          </Box>
        )}

        {!loading && displayedCategories.length > 0 && (
          <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {displayedCategories.map((category) => (
              <MobileCategoryCard key={category.id} category={category} onTap={handleCategoryTap} />
            ))}
            <div ref={sentinelRef} style={{ height: 20 }} />
            {displayCount < filteredCategories.length && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        )}

        <CategoryImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      </Box>
    </MobileAppShell>
  );
};
