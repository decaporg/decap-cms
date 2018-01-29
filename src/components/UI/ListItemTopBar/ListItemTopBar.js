import React from 'react';
import c from 'classnames';
import { Icon } from 'UI';


export const ListItemTopBar = ({ collapsed, onCollapseToggle, onRemove, dragHandleHOC, className }) => {
  const DragHandle = dragHandleHOC && dragHandleHOC(() =>
    <span className="nc-listItemTopBar-dragIcon">
      <Icon type="drag-handle" size="small"/>
    </span>
  );

  return (
    <div className={c('nc-listItemTopBar', className)}>
      {
        onCollapseToggle
          ? <button className="nc-listItemTopBar-toggleButton" onClick={onCollapseToggle}>
              <Icon type="chevron" size="small" direction={collapsed ? 'right' : 'down'}/>
            </button>
          : null
      }
      { dragHandleHOC ? <DragHandle/> : null }
      {
        onRemove
          ? <button className="nc-listItemTopBar-removeButton" onClick={onRemove}>
              <Icon type="close" size="small"/>
            </button>
          : null
      }
    </div>
  );
};
