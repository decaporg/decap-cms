import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';
import getMockData from '../utils/getMockData';

import Table from '.';
import Icon from '../Icon';
import { Menu, MenuItem } from '../Menu';
import { Tag } from '../Tag';

const Title = styled.div`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-weight: bold;
`;
const Subtitle = styled.div`
  font-size: 12px;
`;

export default {
  title: 'Components/Table',
  decorators: [withKnobs],
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

const mockData = getMockData('post', 500);

export const _Table = () => {
  const onClick = boolean('onClick', true);
  const draggable = boolean('draggable', true);
  const selectable = boolean('selectable', true);
  const rowSize = select(
    'size',
    { xs: 'xs', sm: 'sm', 'md (default)': null, lg: 'lg', xl: 'xl' },
    null,
  );

  const columns = React.useMemo(
    () => [
      {
        id: 'featured',
        Cell({ row: { original: rowData } }) {
          return <>{rowData.featured && <FeaturedIcon />}</>;
        },
        width: '32px',
      },
      {
        id: 'featuredImage',
        Cell({ row: { original: rowData } }) {
          return <FeaturedImage size={rowSize} srcUrl={rowData.featuredImage.small} />;
        },
        width: `${((rowSize === 'xs'
          ? 1.5
          : rowSize === 'sm'
          ? 2
          : rowSize === 'lg'
          ? 3
          : rowSize === 'xl'
          ? 3.5
          : 2.5) +
          1) *
          16}px`,
      },
      {
        Header: 'Title',
        accessor: 'title',
        Cell({ row: { original: rowData } }) {
          return (
            <>
              <Title>{rowData.title}</Title>
              {rowSize !== 'xs' && rowSize !== 'sm' && <Subtitle>{rowData.description}</Subtitle>}
            </>
          );
        },
        width: 'auto',
      },
      {
        Header: 'Category',
        accessor: 'category',
        width: '10%',
      },
      {
        Header: 'Status',
        accessor: 'status',
        width: '10%',
        Cell({ row: { original: rowData } }) {
          const [menuAnchorEl, setMenuAnchorEl] = useState();
          const [status, setStatus] = useState(rowData.status);

          return (
            <>
              <Tag
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
              </Tag>
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
        Header: 'Date Modified',
        accessor: 'dateModified',
        width: '15%',
      },
      {
        Header: 'Date Created',
        accessor: 'dateCreated',
        width: '15%',
      },
      {
        Header: 'Author',
        accessor: 'author',
        width: '10%',
      },
    ],
    [rowSize],
  );

  return (
    <Wrap>
      <Table
        columns={columns}
        data={mockData}
        rowSize={rowSize}
        draggable={draggable}
        selectable={selectable}
        onSelect={selected => console.log({ selected })}
        onClick={onClick ? rowData => alert(`You just clicked table row ${rowData.id}.`) : null}
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
                console.log(rowData);
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
};

_Table.story = {
  name: 'Table',
};
