import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor as KeyboardSensorCore,
  MouseSensor as MouseSensorCore,
  TouchSensor as TouchSensorCore,
  PointerSensor as PointerSensorCore,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

import Field from '../../Field';
import { Button } from '../../Buttons';
import ListFieldItem from './ListFieldItem';
import { TreeContentWrap } from '../../Tree/Tree';

export class MouseSensor extends MouseSensorCore {
  static activators = [
    {
      eventName: 'onMouseDown',
      handler: ({ nativeEvent: event }) => {
        return shouldHandleEvent(event.target);
      },
    },
  ];
}

export class TouchSensor extends TouchSensorCore {
  static activators = [
    {
      eventName: 'onTouchStart',
      handler: ({ nativeEvent: event }) => {
        return shouldHandleEvent(event.target);
      },
    },
  ];
}

export class PointerSensor extends PointerSensorCore {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }) => {
        return shouldHandleEvent(event.target);
      },
    },
  ];
}

export class KeyboardSensor extends KeyboardSensorCore {
  static activators = [
    {
      eventName: 'onKeyDown',
      handler: ({ nativeEvent: event }) => {
        return shouldHandleEvent(event.target);
      },
    },
  ];
}

function shouldHandleEvent(target) {
  while (target) {
    if (target.dataset && target.dataset.noDnd) {
      return false;
    }
    target = target.parentElement;
  }

  return true;
}

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `${id}` }); // Prevent falsy id if index is 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    listStyleType: 'none',
    touchAction: 'none',
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </li>
  );
}

const StyledSortableContainer = styled.ul`
  padding: 0;
  margin: 0;
`;

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
const DragOverlayListFieldItem = styled(ListFieldItem)`
  background: ${({ theme }) => theme.color.elevatedSurface};
  box-shadow: 0 0 4px 1px
      ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(14, 30, 37, 0.06)')},
    0 ${({ isMobile }) => (isMobile ? '-' : '')}8px 16px 0
      ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(14, 30, 37, 0.2)')};
  border-radius: ${({ isMobile }) => (isMobile ? 0 : '6px')};
  & ${TreeContentWrap} {
    box-shadow: 0 0 0 0 transparent;
  }
`;

function ListField({
  name,
  label,
  labelSingular,
  items: defaultItems,
  className,
  inline,
  onChange,
}) {
  const [activeId, setActiveId] = useState(null);
  const [focus, setFocus] = useState(false);
  const [items, setItems] = useState(defaultItems || []);
  const [expandedItems, setExpandedItems] = useState([]);

  const activationConstraint = { distance: 4 };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint }),
    useSensor(MouseSensor, { activationConstraint }),
    useSensor(TouchSensor, { activationConstraint }),
    useSensor(KeyboardSensor, {
      activationConstraint,
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function addListItem(index, data = {}) {
    const newItems = [...items];
    newItems.splice(index, 0, data);
    const newExpandedItems = expandedItems.map(item => (item >= index ? item + 1 : item));

    setItems(newItems);
    setExpandedItems(newExpandedItems);

    setTimeout(() => toggleExpand(index));
  }

  function handleAdd() {
    addListItem(items.length);
  }

  function handleDelete(index) {
    let newItems = [...items];
    const isExpanded = expandedItems.indexOf(index) !== -1;

    if (isExpanded) {
      toggleExpand(index);
    }

    delete newItems[index];
    newItems = newItems.filter(item => item !== null);

    setItems(newItems);
    onChange(newItems);
  }

  function handleChange(data, index) {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      ...data,
    };

    setItems(newItems);
    onChange(newItems);
  }

  function toggleExpand(index) {
    const newExpandedItems = [...expandedItems];
    const expandedItemsIndex = newExpandedItems.indexOf(index);
    const isExpanded = expandedItemsIndex !== -1;

    if (isExpanded) {
      newExpandedItems.splice(expandedItemsIndex, 1);
    } else {
      newExpandedItems.push(index);
    }

    setExpandedItems(newExpandedItems);
  }

  function moveListItem(oldIndex, newIndex) {
    const newItems = arrayMove(items, oldIndex, newIndex);
    const newExpandedItems = expandedItems.map(item => {
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

    setItems(newItems);
    setExpandedItems(newExpandedItems);
    onChange(newItems);
  }

  function handleDragStart({ active }) {
    setFocus(true);
    setActiveId(active.id);
  }

  function handleDragEnd({ active, over }) {
    setFocus(false);

    if (over && active.id !== over?.id) {
      moveListItem(active.id, over.id);
    }

    setActiveId(null);
  }

  console.log('listField', items);

  return (
    <Field label={label} labelTarget={name} focus={focus} className={className} inline={inline}>
      <ActionWrap>
        {items && items.length > 1 && (
          <Button
            size="sm"
            onClick={() => {
              if (expandedItems.length) {
                setExpandedItems([]);
              } else {
                setExpandedItems(items.map((item, index) => index));
              }
            }}
          >
            {expandedItems.length ? 'Collapse' : 'Expand'} All
          </Button>
        )}
      </ActionWrap>

      <StyledSortableContainer>
        <DndContext
          sensors={sensors}
          colisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => {
              const itemExpanded = expandedItems.indexOf(index) !== -1;

              return (
                <SortableItem key={index} id={index}>
                  <ListFieldItem
                    itemExpanded={itemExpanded}
                    labelSingular={labelSingular}
                    index={index}
                    item={item}
                    items={items}
                    onDelete={handleDelete}
                    handleChange={handleChange}
                    toggleExpand={toggleExpand}
                    last={index === items.length - 1}
                    addListItem={addListItem}
                    moveListItem={moveListItem}
                  />
                </SortableItem>
              );
            })}
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <DragOverlayListFieldItem
                itemExpanded={!expandedItems[activeId]}
                labelSingular={labelSingular}
                id={activeId}
                index={activeId}
                item={items[activeId]}
                items={items}
                onDelete={handleDelete}
                handleChange={handleChange}
                toggleExpand={toggleExpand}
                last={false}
                addListItem={addListItem}
                moveListItem={moveListItem}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </StyledSortableContainer>

      <StyledButton icon="plus" onClick={handleAdd}>
        Add New {labelSingular}
      </StyledButton>
    </Field>
  );
}

export default ListField;
