import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from '../../Button';
import Tree from '../../Tree';
import { FieldContext } from '../../Field';
import { Menu, MenuItem } from '../../Menu';

const ListItem = styled.div`
  margin-left: -1rem;
  margin-right: -1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  position: relative;
`;
const ListIconActions = styled.div`
  margin-right: -0.5rem;
`;
const AddNewHoverZone = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.625rem;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;
const AddNewIconButton = styled(Button)`
  line-height: 1;
  padding: 0 0.75rem;
  &,
  &:hover,
  &:focus,
  &:active:hover,
  &:focus:hover {
    background-color: ${({ theme }) => theme.color.surface};
  }
  transition: 200ms;
  transform: scale(0);

  ${AddNewHoverZone}:hover & {
    transform: scale(1);
  }
`;

const ListInputItem = ({
  itemExpanded,
  labelSingular,
  index,
  item,
  items,
  fields,
  onDelete,
  addListItem,
  moveListItem,
  handleChange,
  toggleExpand,
  last,
  className,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [treeType, setTreeType] = useState(null);

  function handleOpenMenu(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <ListItem className={className}>
      <Tree
        onExpandToggle={() => toggleExpand(index)}
        expanded={itemExpanded}
        label={labelSingular}
        description={!!Object.keys(item).length && item[Object.keys(item)[0]]}
        type={treeType}
        onHeaderMouseEnter={() => setTreeType('success')}
        onHeaderMouseLeave={() => setTreeType(null)}
        actions={() => (
          <ListIconActions>
            <Button icon="more-horizontal" expanded={itemExpanded} onClick={handleOpenMenu} />
            <Button
              icon="x"
              type="danger"
              expanded={itemExpanded}
              onMouseEnter={() => setTreeType('danger')}
              onMouseLeave={() => setTreeType(null)}
              onClick={() => onDelete(index)}
            />
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
              <MenuItem
                icon="arrow-up"
                onClick={() => {
                  moveListItem(index, index - 1);
                  handleClose();
                }}
                disabled={index === 0}
              >
                Move up
              </MenuItem>
              <MenuItem
                icon="arrow-down"
                onClick={() => {
                  moveListItem(index, index + 1);
                  handleClose();
                }}
                disabled={index === items.length - 1}
              >
                Move down
              </MenuItem>
              <MenuItem
                icon="plus-circle"
                onClick={() => {
                  addListItem(index);
                  handleClose();
                }}
              >
                Add new above
              </MenuItem>
              <MenuItem
                icon="plus-circle"
                onClick={() => {
                  addListItem(index + 1);
                  handleClose();
                }}
              >
                Add new below
              </MenuItem>
              <MenuItem
                icon="copy"
                onClick={() => {
                  addListItem(index + 1, item);
                  handleClose();
                }}
                onMouseEnter={() => setTreeType('success')}
                onMouseLeave={() => setTreeType(null)}
              >
                Duplicate
              </MenuItem>
              <MenuItem
                icon="trash-2"
                onClick={() => {
                  onDelete(index);
                  handleClose();
                }}
                onMouseEnter={() => setTreeType('danger')}
                onMouseLeave={() => setTreeType(null)}
                type="danger"
              >
                Delete
              </MenuItem>
            </Menu>
          </ListIconActions>
        )}
      >
        <FieldContext.Provider value={{ inline: true }}>
          {fields && fields(handleChange, index)}
        </FieldContext.Provider>
      </Tree>
      {!last && (
        <AddNewHoverZone>
          <AddNewIconButton
            icon="plus-circle"
            onClick={() => addListItem(index + 1)}
            iconSize="1.5rem"
          />
        </AddNewHoverZone>
      )}
    </ListItem>
  );
};

export default ListInputItem;
