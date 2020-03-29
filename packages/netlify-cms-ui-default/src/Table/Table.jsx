import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTable, useSortBy, useFlexLayout } from 'react-table';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

import Icon from '../Icon';
import { IconButton } from '../Button';

const TableWrap = styled.div``;
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
  display: flex;
  flex-direction: column;
`;
const TRow = styled.div`
  display: flex;
  justify-content: stretch;
  height: 56px;
  padding: 0 0.5rem;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  transition-duration: 200ms;
  transition-property: background-color;
  &:hover {
    background-color: ${({ theme }) => theme.color.surface};
  }
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

const TableRow = sortableElement(({ children }) => <TRow>{children}</TRow>);
const TableBody = sortableContainer(({ children }) => <TBody>{children}</TBody>);

const Table = ({ columns, data, selectable, renderMenu, onClick }) => {
  const getCols = () => [
    ...(selectable
      ? [
          {
            id: 'rowSelect',
            // minWidth: 32,
            width: '32px',
            // maxWidth: 32,
            Cell() {
              return <input type="checkbox" />;
            },
          },
        ]
      : []),
    ...columns,
    ...(renderMenu
      ? [
          {
            id: 'rowSelect',
            onlyShowOnRowHover: true,
            // minWidth: 48,
            width: '48px',
            // maxWidth: 48,
            Cell({ row: { original: rowData }, onMenuToggle }) {
              const [anchorEl, setAnchorEl] = useState();

              return (
                <>
                  <IconButton
                    icon="more-vertical"
                    onClick={e => {
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
  const [sortedData, setSortedData] = useState(data);
  const [cols, setCols] = useState(getCols());
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns: cols,
      data: sortedData,
    },
    useSortBy,
    useFlexLayout,
  );

  useEffect(() => setSortedData(data), [data]);

  const handleDrop = ({ oldIndex, newIndex }) =>
    setSortedData(
      arrayMove(
        rows.map(row => row.original),
        oldIndex,
        newIndex,
      ),
    );

  // Render the UI for your table
  return (
    <TableWrap {...getTableProps()}>
      <TableHeader>
        {headerGroups.map((headerGroup, headerGroupIndex) => (
          <TableHeaderRow {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex}>
            {headerGroup.headers.map((column, headerIndex) => {
              console.log({ column });
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
        distance={1}
        lockToContainerEdges
        lockOffset="0%"
        onSortEnd={handleDrop}
      >
        {rows.map((row, i) => {
          prepareRow(row);

          return (
            <TableRow
              key={i}
              index={i}
              {...row.getRowProps()}
              onClick={onClick ? () => onClick(row.original) : null}
            >
              {row.cells.map((cell, cellIndex) => {
                const [menuOpen, setMenuOpen] = useState();
                console.log({ cell });
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
        })}
      </TableBody>
    </TableWrap>
  );
};

export default Table;
