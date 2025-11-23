import React, { memo } from 'react';
import { TableHead, TableRow, TableCell, TableSortLabel, Box, TextField, Checkbox } from '@mui/material';
import { Column } from './DataTable';

interface TableHeaderProps<T> {
  columns: Column<T>[];
  orderBy: keyof T;
  order: 'asc' | 'desc';
  filters: { [key in keyof T]?: string };
  onRequestSort: (property: keyof T) => void;
  onFilterChange: (column: keyof T, value: string) => void;
  enableSelection?: boolean;
  selected?: (string | number)[];
  onSelectAll?: (checked: boolean, visibleIds: (string | number)[]) => void;
  visibleRowIds?: (string | number)[];
}

function TableHeaderComponent<T>(props: TableHeaderProps<T>) {
  const { columns, orderBy, order, filters, onRequestSort, onFilterChange, enableSelection, selected = [], onSelectAll, visibleRowIds = [] } = props;

  const allSelected = visibleRowIds.length > 0 && visibleRowIds.every(id => selected.includes(id));
  const someSelected = visibleRowIds.some(id => selected.includes(id));

  return (
    <TableHead>
      <TableRow>
        {enableSelection && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={someSelected && !allSelected}
              checked={allSelected}
              onChange={e => onSelectAll?.(e.target.checked, visibleRowIds)}
              inputProps={{ 'aria-label': 'select all' }}
            />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell key={String(column.id)} align={column.align} sortDirection={orderBy === column.id ? order : false} sx={{ minWidth: column.minWidth, width: 'auto' }}>
            <TableSortLabel
              active={orderBy === column.id}
              direction={orderBy === column.id ? order : 'asc'}
              onClick={() => onRequestSort(column.id as keyof T)}
            >
              {column.label}
            </TableSortLabel>
            {column.filter && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  placeholder={`Filter ${column.label}`}
                  value={filters[column.id as keyof T] || ''}
                  onChange={(e) => onFilterChange(column.id as keyof T, e.target.value)}
                  fullWidth
                />
              </Box>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export const TableHeader = memo(TableHeaderComponent) as typeof TableHeaderComponent;