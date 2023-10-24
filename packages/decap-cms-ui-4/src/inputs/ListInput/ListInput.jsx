import React from 'react';
import styled from '@emotion/styled';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import Field from '../../Field';
import { Button } from '../../Button';
import ListInputItem from './ListInputItem';
import { TreeContentWrap } from '../../Tree/Tree';

const Draggable = sortableElement(({ children }) => <>{children}</>);

const Container = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 1rem;
`;
const ActionWrap = styled.div`
  position: absolute;
  top: -1rem;
  right: 0;
  z-index: 1;
`;
const StyledListInputItem = styled(ListInputItem)`
  &.dragging {
    background: ${({ theme }) => theme.color.elevatedSurface};
    box-shadow: 0 0 4px 1px
        ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(14, 30, 37, 0.06)')},
      0 ${({ isMobile }) => (isMobile ? '-' : '')}8px 16px 0
        ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(14, 30, 37, 0.2)')};
    border-radius: ${({ isMobile }) => (isMobile ? 0 : '6px')};
    & ${TreeContentWrap} {
      box-shadow: 0 0 0 0 transparent;
    }
  }
`;

class ListInput extends React.Component {
  state = { focus: false, items: [], expandedItems: [] };

  addListItem = (index, data = {}) => {
    const items = [...this.state.items];
    items.splice(index, 0, data);
    const expandedItems = this.state.expandedItems.map(item => (item >= index ? item + 1 : item));

    this.setState({ items, expandedItems }, () => {
      this.props.onChange(this.state.items);
      setTimeout(() => this.toggleExpand(index));
    });
  };

  handleAdd = () => this.addListItem(this.state.items.length);

  handleDelete = index => {
    let items = [...this.state.items];
    const isExpanded = this.state.expandedItems.indexOf(index) !== -1;

    if (isExpanded) {
      this.toggleExpand(index);
    }

    delete items[index];
    items = items.filter(item => item !== null);

    this.setState({ items }, () => this.props.onChange(this.state.items));
  };

  handleChange = (data, index) => {
    const items = [...this.state.items];
    items[index] = {
      ...items[index],
      ...data,
    };

    this.setState({ items }, () => this.props.onChange(this.state.items));
  };

  toggleExpand = index => {
    let expandedItems = [...this.state.expandedItems];
    const expandedItemsIndex = expandedItems.indexOf(index);
    const isExpanded = expandedItemsIndex !== -1;

    if (isExpanded) {
      delete expandedItems[expandedItemsIndex];
      expandedItems = expandedItems.filter(id => id !== null);
    } else {
      expandedItems.push(index);
    }
    this.setState({ expandedItems });
  };

  moveListItem = (oldIndex, newIndex) => {
    const items = arrayMove([...this.state.items], oldIndex, newIndex);
    const expandedItems = this.state.expandedItems.map(item => {
      if (item === oldIndex) return newIndex;
      if (
        item === newIndex ||
        (item > oldIndex && item < newIndex) ||
        (item < oldIndex && item > newIndex)
      ) {
        if (oldIndex < newIndex) return item - 1;
        if (oldIndex > newIndex) return item + 1;
      }
      return item;
    });

    // Setting items to empty array intentionally to trigger unmount and remount so no transition animation occurs
    this.setState({ items: [], expandedItems }, () =>
      this.setState({ items }, () => this.props.onChange(this.state.items)),
    );
  };

  handleDrop = ({ oldIndex, newIndex }) => {
    this.moveListItem(oldIndex, newIndex);
  };

  render() {
    const { name, label, labelSingular, fields, className, inline } = this.props;
    const { focus, items, expandedItems } = this.state;

    return (
      <Field label={label} labelTarget={name} focus={focus} className={className} inline={inline}>
        <ActionWrap>
          {items && items.length > 1 && (
            <Button
              size="sm"
              onClick={() => {
                if (expandedItems.length) {
                  this.setState({ expandedItems: [] });
                } else {
                  this.setState({
                    expandedItems: items.map((item, index) => index),
                  });
                }
              }}
            >
              {expandedItems.length ? 'Collapse' : 'Expand'} All
            </Button>
          )}
        </ActionWrap>
        <Container
          onSortEnd={this.handleDrop}
          lockAxis="y"
          helperClass="dragging"
          distance={1}
          lockToContainerEdges
          lockOffset="0%"
        >
          {items.map((item, index) => {
            const itemExpanded = expandedItems.indexOf(index) !== -1;

            return (
              <Draggable key={name + index} index={index}>
                <StyledListInputItem
                  itemExpanded={itemExpanded}
                  labelSingular={labelSingular}
                  index={index}
                  item={item}
                  items={items}
                  fields={fields}
                  onDelete={this.handleDelete}
                  handleChange={this.handleChange}
                  toggleExpand={this.toggleExpand}
                  last={index === items.length - 1}
                  addListItem={this.addListItem}
                  moveListItem={this.moveListItem}
                />
              </Draggable>
            );
          })}
        </Container>

        <StyledButton icon="plus" onClick={this.handleAdd}>
          Add New {labelSingular}
        </StyledButton>
      </Field>
    );
  }
}

export default ListInput;
