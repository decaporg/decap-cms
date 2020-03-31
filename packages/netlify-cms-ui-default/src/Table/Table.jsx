import React, { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { useTable, useSortBy, useFlexLayout, useRowSelect } from 'react-table';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import arrayMove from 'array-move';
import color from 'color';

import Icon from '../Icon';
import { IconButton } from '../Button';

const TableWrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const TableHeader = styled.div`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.color.background};
  z-index: 1;
`;
const TableHeaderRow = styled.div`
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
const TableHeaderCell = styled.div`
  text-transform: uppercase;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.5px;
  padding: 0 0.5rem;
  line-height: 16px;
  transition: color 200ms;
  color: ${({ theme }) => theme.color.lowEmphasis};
  ${({ width }) => (width ? `width: ${width};` : ``)}
  ${({ width }) => (width === 'auto' ? `flex: 1;` : ``)}
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
const TBody = styled.div`
  position: relative;
  flex: 1;
`;
const TRow = styled.div`
  display: flex;
  justify-content: stretch;
  height: 56px;
  padding: 0 0.5rem;
  align-items: center;
  background-color: ${({ isSelected, theme }) =>
    isSelected
      ? color(theme.color.success['500'])
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
          ? color(theme.color.success['500'])
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
const TableCell = styled.div`
  font-size: 14px;
  padding: 0 0.5rem;
  color: ${({ theme }) => theme.color.mediumEmphasis};
  display: flex;
  flex-direction: column;
  justify-content: center;
  ${({ width }) => (width ? `width: ${width};` : ``)}
  ${({ width }) => (width === 'auto' ? `flex: 1;` : ``)}

  ${({ onlyShowOnRowHover }) =>
    onlyShowOnRowHover
      ? `
    opacity: 0;
    transition: opacity 200ms;
    ${TRow}:hover & {
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
          ? theme.color.success[600]
          : theme.color.lowEmphasis,
      )
        .alpha(checked ? 1 : 0.75)
        .string()};
  border-radius: 0.75rem;
  background-color: ${({ checked, theme }) =>
    checked ? theme.color.success['500'] : `rgba(0, 0, 0, 0.05)`};
  transition: 150ms;
  cursor: pointer;
  color: white;
  &:hover {
    background-color: ${({ checked, theme }) =>
      checked ? theme.color.success['500'] : `rgba(0, 0, 0, 0.1)`};
    box-shadow: inset 0 0 0 2px
      ${({ checked, theme }) =>
        color(
          theme.darkMode
            ? theme.color.highEmphasis
            : checked
            ? theme.color.success[600]
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

const SelectToggle = ({ id, onClick, checked, indeterminate, ...props }) => {
  return (
    <SelectToggleWrap
      onClick={e => {
        console.log(props);
        onClick(e);
      }}
      checked={checked}
      indeterminate={indeterminate}
      htmlFor={id}
    >
      <SelectIcon />
      <input {...props} type="checkbox" id={id} checked={checked} style={{ display: 'none' }} />
    </SelectToggleWrap>
  );
};

const TableRow = sortableElement(({ children, ...props }) => <TRow {...props}>{children}</TRow>);
const TableBody = sortableContainer(({ children }) => <TBody>{children}</TBody>);

const Table = ({ columns, data, selectable, onSelect, renderMenu, onClick, draggable }) => {
  const [sortedData, setSortedData] = useState(data);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows,
    state: { selectedRowIds },
  } = useTable(
    {
      columns,
      data: sortedData,
    },
    useSortBy,
    useFlexLayout,
    useRowSelect,
    hooks => {
      hooks.visibleColumns.push(columns => [
        ...(selectable
          ? [
              {
                id: 'selection',
                // The header can use the table's getToggleAllRowsSelectedProps method
                // to render a checkbox
                Header({ getToggleAllRowsSelectedProps }) {
                  return (
                    <div>
                      <SelectToggle id="table-header-select" {...getToggleAllRowsSelectedProps()} />
                    </div>
                  );
                },
                // The cell can use the individual row's getToggleRowSelectedProps method
                // to the render a checkbox
                Cell({ row }) {
                  return (
                    <div>
                      <SelectToggle
                        {...row.getToggleRowSelectedProps()}
                        onClick={e => e.stopPropagation()}
                        id={row.id}
                      />
                    </div>
                  );
                },
                width: '48px',
              },
            ]
          : []),
        ...columns,
        ...(renderMenu
          ? [
              {
                id: 'rowMenu',
                onlyShowOnRowHover: true,
                width: '48px',
                Cell({ row: { original: rowData }, onMenuToggle }) {
                  const [anchorEl, setAnchorEl] = useState();

                  return (
                    <>
                      <IconButton
                        icon="more-vertical"
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
      ]);
    },
  );

  useEffect(() => setSortedData(data), [data]);

  useEffect(() => onSelect(selectedFlatRows.map(row => row.original.id)), [selectedFlatRows]);

  const handleDrop = ({ oldIndex, newIndex }) =>
    setSortedData(
      arrayMove(
        rows.map(row => row.original),
        oldIndex,
        newIndex,
      ),
    );

  const RenderRow = useCallback(
    ({ index, style }) => {
      const row = rows[index];

      prepareRow(row);

      return (
        <TableRow
          key={index}
          index={index}
          {...row.getRowProps()}
          clickable={!!onClick}
          onClick={onClick ? () => onClick(row.original) : null}
          disabled={!draggable}
          isSelected={row.isSelected}
          style={style}
        >
          {row.cells.map((cell, cellIndex) => {
            const [menuOpen, setMenuOpen] = useState();

            return (
              <TableCell
                {...cell.getCellProps()}
                key={cellIndex}
                onlyShowOnRowHover={cell.column.onlyShowOnRowHover && !menuOpen}
                width={cell.column.width}
              >
                {cell.render('Cell', { onMenuToggle: open => setMenuOpen(open) })}
              </TableCell>
            );
          })}
        </TableRow>
      );
    },
    [prepareRow, rows],
  );

  // Render the UI for your table
  return (
    <TableWrap {...getTableProps()}>
      <TableHeader>
        {headerGroups.map((headerGroup, headerGroupIndex) => (
          <TableHeaderRow {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex}>
            {headerGroup.headers.map((column, headerIndex) => {
              return (
                <TableHeaderCell
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={headerIndex}
                  canSort={column.canSort}
                  width={column.width}
                >
                  {column.render('Header')}
                  {column.canSort && (
                    <SortIcon desc={column.isSortedDesc} isSorted={column.isSorted} />
                  )}
                </TableHeaderCell>
              );
            })}
          </TableHeaderRow>
        ))}
      </TableHeader>
      <TableBody
        {...getTableBodyProps()}
        lockAxis={'y'}
        helperClass="dragging"
        distance={2}
        lockToContainerEdges
        lockOffset="0%"
        onSortEnd={handleDrop}
      >
        <AutoSizer>
          {({ height, width }) => (
            <List
              className="List"
              height={height}
              itemCount={rows.length}
              itemSize={56}
              width={width}
              overscanCount={40}
              itemData={rows}
              itemKey={(index, data) => data[index].id}
            >
              {RenderRow}
            </List>
          )}
        </AutoSizer>
      </TableBody>
    </TableWrap>
  );
};

export default Table;
