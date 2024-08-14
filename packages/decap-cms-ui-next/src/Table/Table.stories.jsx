import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { action } from '@storybook/addon-actions';

import Table from './Table';
import Icon from '../Icon';
import { Menu, MenuItem } from '../Menu';
import { Badge } from '../Badge';
import getMockData from '../utils/getMockData';

export default {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    draggable: { control: 'boolean' },
    selectable: { control: 'boolean' },
    rowSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      mapping: {
        md: null,
      },
      table: {
        defaultValue: { summary: 'md' },
      },
    },
  },
  args: {
    draggable: true,
    selectable: true,
    rowSize: 'md',
    onSelect: action('onSelect'),
    onClick: action('onClick'),
  },
};

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.color.background};
`;

const FeaturedImage = styled.div`
  background-image: url(${({ srcUrl }) => srcUrl});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  width: ${({ size }) =>
    size === 'xs' ? 1.5 : size === 'sm' ? 2 : size === 'lg' ? 3 : size === 'xl' ? 3.5 : 2.5}rem;
  height: ${({ size }) =>
    size === 'xs' ? 1.5 : size === 'sm' ? 2 : size === 'lg' ? 3 : size === 'xl' ? 3.5 : 2.5}rem;
  border-radius: 6px;
`;

const FeaturedIcon = styled(Icon)`
  stroke: none;
  fill: #ffc762;
`;
FeaturedIcon.defaultProps = {
  size: 'sm',
  name: 'star',
};

const Title = styled.div`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-weight: bold;
`;

const Subtitle = styled.div`
  font-size: 12px;
`;

const mockData = getMockData('post', 200);

export function _Table(args) {
  const { rowSize } = args;

  const columns = useMemo(
    () => [
      {
        id: 'featured',
        cell({ row: { original: rowData } }) {
          return <>{rowData.featured && <FeaturedIcon />}</>;
        },
        size: 32,
      },
      {
        id: 'featuredImage',
        cell({ row: { original: rowData } }) {
          return <FeaturedImage size={rowSize} srcUrl={rowData.featuredImage.small} />;
        },
        size:
          ((rowSize === 'xs'
            ? 1.5
            : rowSize === 'sm'
            ? 2
            : rowSize === 'lg'
            ? 3
            : rowSize === 'xl'
            ? 3.5
            : 2.5) +
            1) *
          16,
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        cell({ row: { original: rowData } }) {
          return (
            <>
              <Title>{rowData.title}</Title>
              {rowSize !== 'xs' && rowSize !== 'sm' && <Subtitle>{rowData.description}</Subtitle>}
            </>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        accessorKey: 'category',
        size: Math.round(window.innerWidth * 0.1), // 10%
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        size: Math.round(window.innerWidth * 0.1), // 10%
        cell({ row: { original: rowData } }) {
          const [menuAnchorEl, setMenuAnchorEl] = useState();
          const [status, setStatus] = useState(rowData.status);

          return (
            <>
              <Badge
                onClick={e => {
                  e.stopPropagation();
                  setMenuAnchorEl(e.currentTarget);
                }}
                hasMenu
                color={
                  status === 'Published'
                    ? 'turquoise'
                    : status === 'In Review'
                    ? 'yellow'
                    : status === 'Draft'
                    ? 'pink'
                    : null
                }
              >
                {status}
              </Badge>
              <Menu
                anchorEl={menuAnchorEl}
                open={!!menuAnchorEl}
                onClose={e => {
                  e.stopPropagation();
                  setMenuAnchorEl(null);
                }}
              >
                <MenuItem
                  icon="edit-3"
                  selected={status === 'Draft'}
                  onClick={e => {
                    e.stopPropagation();
                    setStatus('Draft');
                    setMenuAnchorEl(null);
                  }}
                >
                  Draft
                </MenuItem>
                <MenuItem
                  icon="inbox"
                  selected={status === 'In Review'}
                  onClick={e => {
                    e.stopPropagation();
                    setStatus('In Review');
                    setMenuAnchorEl(null);
                  }}
                >
                  In Review
                </MenuItem>
                <MenuItem
                  icon="radio"
                  selected={status === 'Published'}
                  onClick={e => {
                    e.stopPropagation();
                    setStatus('Published');
                    setMenuAnchorEl(null);
                  }}
                >
                  Published
                </MenuItem>
              </Menu>
            </>
          );
        },
      },
      {
        id: 'dateModified',
        header: 'Date Modified',
        accessorKey: 'dateModified',
        size: Math.round(window.innerWidth * 0.15), // 15%
      },
      {
        id: 'dateCreated',
        header: 'Date Created',
        accessorKey: 'dateCreated',
        size: Math.round(window.innerWidth * 0.15), // 15%
      },
      {
        id: 'author',
        header: 'Author',
        accessorKey: 'author',
        size: Math.round(window.innerWidth * 0.1), // 10%
      },
    ],
    [rowSize],
  );

  return (
    <Wrap>
      <Table
        {...args}
        columns={columns}
        data={mockData}
        renderMenu={({ rowData, anchorEl, closeMenu }) => (
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={closeMenu}
            anchorOrigin={{ x: 'right', y: 'bottom' }}
            transformOrigin={{ x: 'right', y: 'top' }}
          >
            <MenuItem
              icon="edit-3"
              onClick={e => {
                e.stopPropagation();
                alert(`Editing post ${rowData.id}.`);
                closeMenu();
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              icon="copy"
              onClick={e => {
                e.stopPropagation();
                alert(`Duplicating post ${rowData.id}.`);
                closeMenu();
              }}
            >
              Duplicate
            </MenuItem>
            <MenuItem
              icon="trash-2"
              type="danger"
              onClick={e => {
                e.stopPropagation();
                alert(`Deleting post ${rowData.id}.`);
                closeMenu();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        )}
      />
    </Wrap>
  );
}
