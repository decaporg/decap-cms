import React, { Component, PropTypes } from 'react';
import { fromJS, List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import FontIcon from 'react-toolbox/lib/font_icon';
import styles from './repeatable.css';

const RepeatableContainer = SortableContainer(
  ({ items, renderItem }) => <div>{items.map(renderItem)}</div>
);

const DragHandle = SortableHandle(
  () => <FontIcon value="drag_handle" className={styles.dragIcon} />
);

const repeatable = (WrappedComponent) => {
  const RepeatableItem = SortableElement(
    props => (<div {...props}>
      <DragHandle />
      {props.children}
    </div>)
  );

  return class extends Component {
    static propTypes = {
      field: ImmutablePropTypes.map.isRequired,
      value: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.object,
        PropTypes.string,
        PropTypes.bool,
      ]),
      metadata: ImmutablePropTypes.map,
      onChange: PropTypes.func.isRequired,
      forID: PropTypes.string,
    };

    constructor(props) {
      super(props);
    }

    handleChangeFor = index => (newValueForIndex, newMetadata) => {
      const { value, onChange } = this.props;
      const newValue = value.set(index, newValueForIndex);
      onChange(fromJS(newValue));
    };

    handleRemoveFor = index => (e) => {
      e.preventDefault();
      const { value, metadata, onChange, forID } = this.props;
      const parsedMetadata = metadata && {
        [forID]: metadata.removeIn(value.get(index).valueSeq()),
      };
      onChange(value.remove(index), parsedMetadata);
    };

    handleAdd = (e) => {
      e.preventDefault();
      const { value, onChange } = this.props;
      onChange((value || List()).push(null));
    };

    renderItem = (item, i) =>
      (<RepeatableItem key={`item-${ i }`} index={i}>
        <button className={styles.removeButton} onClick={this.handleRemoveFor(i)}>
          <FontIcon value="close" />
        </button>
        <WrappedComponent
          {...this.props}
          className={styles.repeatedComponent}
          value={item}
          onChange={this.handleChangeFor(i)}
        />
      </RepeatableItem>);

    onSortEnd = ({ oldIndex, newIndex }) => {
      const oldItem = this.props.value.get(oldIndex);
      const newValue = this.props.value.delete(oldIndex).insert(newIndex, oldItem);
      this.props.onChange(newValue);
    };

    renderItems() {
      const { value, field, forID } = this.props;
      return (<div id={forID}>
        <RepeatableContainer
          items={value || List()}
          renderItem={this.renderItem}
          onSortEnd={this.onSortEnd}
          useDragHandle={true}
        />
        <button className={styles.addButton} onClick={this.handleAdd}>
          <FontIcon value="add" className={styles.addButtonText} />
          <span className={styles.addButtonText}>
            new {field.get('label', '').toLowerCase()}
          </span>
        </button>
      </div>);
    }

    render() {
      if (this.props.field.get("repeat", false)) {
        return this.renderItems();
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

export default repeatable;
