import React from 'react';
import styled from '@emotion/styled';
import Field from '../Field';
import Button from '../Button';
import ListWidgetItem from '../ListWidgetItem';
import { Container, Draggable } from 'react-smooth-dnd';

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 1rem;
`;
const ActionWrap = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`;

class ListWidget extends React.Component {
  state = { focus: false, items: [], expandedItems: [] };

  handleAdd = pos => {
    const items = [...this.state.items];
    items.push({});

    this.setState({ items }, () => {
      this.props.onChange(this.state.items);
      setTimeout(() => this.toggleExpand(this.state.items.length - 1));
    });
  };

  handleAddAfterClick = index => {
    const items = [...this.state.items];
    items.splice(index + 1, 0, {});
    const expandedItems = this.state.expandedItems.map(item => (item > index ? item + 1 : item));

    this.setState({ items, expandedItems }, () => {
      this.props.onChange(this.state.items);
      setTimeout(() => this.toggleExpand(index + 1));
    });
  };

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

  handleDrop(dropResult) {
    const { removedIndex, addedIndex, payload, element } = dropResult;
    console.log({ removedIndex, addedIndex, payload, element });
  }

  render() {
    const { name, label, labelSingular, fields } = this.props;
    const { focus, items, expandedItems } = this.state;

    return (
      <Field label={label} labelTarget={name} focus={focus}>
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
          onDrop={this.handleDrop}
          lockAxis="y"
          dropPlaceholder={{
            animationDuration: 150,
            showOnTop: true,
            className: 'dnd-list-item-drop-preview',
          }}
          dragClass="dnd-list-item-ghost"
          dropClass="dnd-list-item-ghost-drop"
          behaviour="contain"
        >
          {items.map((item, index) => {
            const itemExpanded = expandedItems.indexOf(index) !== -1;

            return (
              <Draggable key={name + index}>
                <ListWidgetItem
                  itemExpanded={itemExpanded}
                  labelSingular={labelSingular}
                  index={index}
                  item={item}
                  fields={fields}
                  onDelete={this.handleDelete}
                  handleChange={this.handleChange}
                  toggleExpand={this.toggleExpand}
                  last={index === items.length - 1}
                  onAddAfterClick={this.handleAddAfterClick}
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

export default ListWidget;
