import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { useVirtualizer } from '@tanstack/react-virtual';
import color from 'color';

import Icon from '../Icon';
import { IconButton } from '../Buttons';

const TableWrap = styled.table`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const TableHeader = styled.thead`
  position: sticky;
  top: 80px; // Height of the header
  z-index: 1;
  background-color: ${({ theme }) => theme.color.background};
`;
const TableHeaderRow = styled.tr`
  display: flex;
  align-items: flex-end;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  position: relative;
  & * {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const TableHeaderCell = styled.th`
  text-transform: uppercase;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-align: left;
  padding: 0 0.5rem;
  line-height: 16px;
  transition: color 200ms;
  color: ${({ theme }) => theme.color.lowEmphasis};
  ${({ width }) => (width ? `width: ${width}px;` : ``)}
  ${({ width }) => (!width ? `flex: 1 1 0%;` : ``)}
  ${({ canSort, theme }) =>
    canSort
      ? `
    cursor: pointer;
    &:hover {
      color: ${theme.color.highEmphasis};
    }
  `
      : `
      cursor: default;
  `}
`;
const TableBody = styled.tbody`
  flex: 1 1 0%;
  height: ${({ height }) => height}px;
`;
const TableRow = styled.tr`
  display: flex;
  justify-content: stretch;
  height: ${({ rowSize }) =>
    rowSize === 'xs'
      ? 32
      : rowSize === 'sm'
      ? 48
      : rowSize === 'lg'
      ? 64
      : rowSize === 'xl'
      ? 80
      : 56}px;
  padding: 0 0.5rem;
  align-items: center;
  background-color: ${({ isSelected, theme }) =>
    isSelected
      ? color(theme.color.success['900'])
          .alpha(theme.darkMode ? 0.1 : 0.15)
          .string()
      : 'transparent'};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  transition-duration: 200ms;
  transition-property: background-color;
  ${({ clickable, isSelected, theme }) =>
    clickable
      ? `
    cursor: pointer;
    &:hover {
      background-color: ${
        isSelected
          ? color(theme.color.success['900'])
              .alpha(theme.darkMode ? 0.15 : 0.05)
              .string()
          : theme.color.surface
      };
    }
  `
      : ``};
  &.dragging {
    transition: 0ms;
    background-color: ${({ theme }) => theme.color.elevatedSurface};
    border: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 16px 32px rgba(0, 0, 0, 0.15);
  }
  & * {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const TableCell = styled.td`
  font-size: ${({ rowSize }) => (rowSize === 'xs' ? `0.75rem` : `0.875rem`)};
  padding: 0 0.5rem;
  color: ${({ theme }) => theme.color.mediumEmphasis};
  display: flex;
  flex-direction: column;
  justify-content: center;
  ${({ width }) => (width ? `width: ${width}px;` : ``)}
  ${({ width }) => (!width ? `flex: 1 1 0%;` : ``)}

  ${({ onlyShowOnRowHover }) =>
    onlyShowOnRowHover
      ? `
    opacity: 0;
    transition: opacity 200ms;
    ${TableRow}:hover & {
      opacity: 1;
    }
  `
      : ``}
`;
const SortIcon = styled(Icon)`
  margin-left: 0.5rem;
  vertical-align: middle;
  transform: rotate(${({ desc }) => (desc ? 0 : -180)}deg)
    scale(${({ isSorted }) => (isSorted ? 1 : 0)}) translateY(${({ desc }) => (desc ? '-' : '')}1px);
  transition: 200ms;
`;
SortIcon.defaultProps = {
  name: 'chevron-down',
  size: 'sm',
};

const SelectToggleWrap = styled.label`
  display: block;
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
  box-shadow: inset 0 0 0 1.5px
    ${({ checked, theme }) =>
      color(
        theme.darkMode
          ? theme.color.highEmphasis
          : checked
          ? theme.color.success[1000]
          : theme.color.lowEmphasis,
      )
        .alpha(checked ? 1 : 0.75)
        .string()};
  border-radius: 0.75rem;
  background-color: ${({ checked, theme }) =>
    checked ? theme.color.success['900'] : `rgba(0, 0, 0, 0.05)`};
  transition: 150ms;
  cursor: pointer;
  color: white;
  &:hover {
    background-color: ${({ checked, theme }) =>
      checked ? theme.color.success['900'] : `rgba(0, 0, 0, 0.1)`};
    box-shadow: inset 0 0 0 2px
      ${({ checked, theme }) =>
        color(
          theme.darkMode
            ? theme.color.highEmphasis
            : checked
            ? theme.color.success[1000]
            : theme.color.lowEmphasis,
        )
          .alpha(checked ? 1 : 0.75)
          .string()};
  }
  & > svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transition: 150ms;
    transform: translate(-50%, -50%) scale(${({ checked }) => (checked ? 1 : 0)});
    stroke-width: 3px;
  }
`;
const SelectIcon = styled(Icon)``;
SelectIcon.defaultProps = {
  name: 'check',
  size: 'sm',
};

const TableCellInside = styled.div``;

function SelectToggle({ id, onChange, checked, indeterminate, ...props }) {
  return (
    <SelectToggleWrap checked={checked} indeterminate={indeterminate} htmlFor={id}>
      <SelectIcon />
      <input
        {...props}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </SelectToggleWrap>
  );
}

function SortableTableRow({ id, children, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow sortable ref={setNodeRef} {...props} style={style} {...attributes} {...listeners}>
      {children}
    </TableRow>
  );
}

function Table({
  className,
  columns: defaultColumns,
  data,
  selectable,
  onSelect,
  selected,
  renderMenu,
  onClick,
  draggable,
  rowSize,
}) {
  const [sortedData, setSortedData] = useState(data);
  const [selectedRows, setSelectedRows] = useState(() => {
    if (selected) {
      return data.filter(row => selected.includes(row.id));
    }
    return [];
  });
  const [columns] = useState(updateVisibleColumns());

  useEffect(() => onSelect && onSelect(selectedRows), [selectedRows]);

  function updateVisibleColumns() {
    return [
      ...(selectable
        ? [
            {
              id: 'selection',
              size: 36,
              header: ({ table }) => (
                <SelectToggle
                  checked={table.getIsAllRowsSelected()}
                  indeterminate={table.getIsSomeRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                />
              ),
              cell: ({ row }) => (
                <SelectToggle
                  id={row.id}
                  checked={row.getIsSelected()}
                  disabled={!row.getCanSelect()}
                  indeterminate={row.getIsSomeSelected()}
                  onChange={row.getToggleSelectedHandler()}
                />
              ),
            },
          ]
        : []),
      ...defaultColumns,
      ...(renderMenu
        ? [
            {
              id: 'rowMenu',
              onlyShowOnRowHover: true,
              size: rowSize === 'xs' ? 24 : 48,
              cell({ row: { original: rowData }, onMenuToggle }) {
                const [anchorEl, setAnchorEl] = useState();

                return (
                  <>
                    <IconButton
                      icon="more-vertical"
                      size={rowSize === 'xs' ? 'sm' : 'md'}
                      onClick={e => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                        onMenuToggle(true);
                      }}
                    />
                    {renderMenu({
                      anchorEl,
                      closeMenu: () => {
                        setAnchorEl(null);
                        onMenuToggle(false);
                      },
                      rowData,
                    })}
                  </>
                );
              },
            },
          ]
        : []),
    ];
  }

  const table = useReactTable({
    columns,
    data,
    defaultColumn: {
      minSize: 0,
      size: 0,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: sortedData,
      rowSelection: selectedRows,
    },
    enableRowSelection: selectable,
    onRowSelectionChange: setSelectedRows,
    onSortingChange: setSortedData,
  });

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    estimateSize: () =>
      rowSize === 'xs' ? 32 : rowSize === 'sm' ? 48 : rowSize === 'lg' ? 64 : 56,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  function handleDragEnd({ active, over }) {
    if (active && over && active.id !== over.id) {
      setSortedData(
        arrayMove(
          table.getRowModel().rows.map(row => row.original),
          active.id,
          over.id,
        ),
      );
    }
  }

  // Render the UI for your table
  return (
    <DndContext
      colisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <div ref={tableContainerRef}>
        <TableWrap className={className}>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableHeaderRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHeaderCell
                    key={header.id}
                    canSort={header.column.getCanSort()}
                    width={header.getSize() !== 0 ? header.getSize() : undefined}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon
                        desc={header.column.getIsSorted() === 'desc'}
                        isSorted={header.column.getIsSorted()}
                      />
                    )}
                  </TableHeaderCell>
                ))}
              </TableHeaderRow>
            ))}
          </TableHeader>

          <TableBody height={rowVirtualizer.getTotalSize()}>
            <SortableContext
              items={table.getRowModel().rows.map(row => row.id)}
              strategy={verticalListSortingStrategy}
              onSortEnd={handleDragEnd}
              disabled={!draggable}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = table.getRowModel().rows[virtualRow.index];

                return (
                  <SortableTableRow
                    key={row.id}
                    id={row.id}
                    data-index={virtualRow.index}
                    ref={node => rowVirtualizer.measureElement(node)}
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`,
                      width: '100%',
                    }}
                    clickable={!!onClick}
                    onClick={
                      selectable
                        ? () => row.toggleRowSelected()
                        : onClick
                        ? () => onClick(row.original)
                        : null
                    }
                    disabled={!draggable}
                    isSelected={row.isSelected}
                    rowSize={rowSize}
                  >
                    {row.getVisibleCells().map(cell => {
                      // const [menuOpen, setMenuOpen] = useState();

                      return (
                        <TableCell
                          key={cell.id}
                          // onlyShowOnRowHover={cell.column.onlyShowOnRowHover && !menuOpen}
                          width={cell.column.getSize() !== 0 ? cell.column.getSize() : undefined}
                          rowSize={rowSize}
                        >
                          <TableCellInside>
                            {/* {cell.render('Cell', { onMenuToggle: open => setMenuOpen(open) })} */}
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCellInside>
                        </TableCell>
                      );
                    })}
                  </SortableTableRow>
                );
              })}
            </SortableContext>
          </TableBody>
        </TableWrap>
      </div>
    </DndContext>
  );
}

export default Table;
