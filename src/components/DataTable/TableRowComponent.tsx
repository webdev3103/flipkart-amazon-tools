import React, { memo } from 'react';
import { TableRow, TableCell, Checkbox, IconButton, Collapse, Box } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Column } from './DataTable';

interface TableRowComponentProps<T> {
  row: T;
  columns: Column<T>[];
  index: number;
  onClick?: (row: T) => void;
  enableSelection?: boolean;
  selected?: boolean;
  onSelect?: (id: string | number, checked: boolean) => void;
  rowId?: string | number;
  renderCollapse?: (row: T) => React.ReactNode;
  isExpanded?: boolean;
  onExpand?: (expanded: boolean) => void;
}

function TableRowComponentBase<T>(props: TableRowComponentProps<T>) {
  const { 
    row, 
    columns, 
    index, 
    onClick, 
    enableSelection, 
    selected = false, 
    onSelect, 
    rowId,
    renderCollapse,
    isExpanded = false,
    onExpand
  } = props;

  const handleCheckboxClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect && rowId !== undefined) {
      onSelect(rowId, e.target.checked);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExpand) {
      onExpand(!isExpanded);
    }
  };

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <React.Fragment>
      <TableRow 
        hover 
        key={index}
        onClick={() => onClick?.(row)}
        sx={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {renderCollapse && (
          <TableCell padding="checkbox">
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={handleExpandClick}
            >
              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
        )}
        {enableSelection && (
          <TableCell padding="checkbox" onClick={handleCellClick}>
            <Checkbox
              checked={selected}
              onChange={handleCheckboxClick}
              inputProps={{ 'aria-label': 'select row' }}
            />
          </TableCell>
        )}
        {columns.map((column) => {
          const value = row[column.id as keyof T];
          return (
            <TableCell key={String(column.id)} align={column.align}>
              {column.format 
                ? column.format(value, row)
                : String(value ?? '')}
            </TableCell>
          );
        })}
      </TableRow>
      {renderCollapse && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + (enableSelection ? 1 : 0) + 1}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                {renderCollapse(row)}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

export const TableRowComponent = memo(TableRowComponentBase) as typeof TableRowComponentBase;