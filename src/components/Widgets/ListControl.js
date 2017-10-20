import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List, Map, fromJS } from 'immutable';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import FontIcon from 'react-toolbox/lib/font_icon';
import ObjectControl from './ObjectControl';

function ListItem(props) {
  return <div {...props} className={`list-item ${ props.className || '' }`}>{props.children}</div>;
}
ListItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
ListItem.displayName = 'list-item';

function valueToString(value) {
  return value ? value.join(',').replace(/,([^\s]|$)/g, ', $1') : '';
}

const SortableListItem = SortableElement(ListItem);
const DragHandle = SortableHandle(
  () => <FontIcon value="drag_handle" className="nc-listControl-dragIcon" />
);
const SortableList = SortableContainer(({ items, renderItem }) =>
  (<div>{items.map(renderItem)}</div>));

const valueTypes = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
};

export default class ListControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
    forID: PropTypes.string,
    getAsset: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { itemsCollapsed: List(), value: valueToString(props.value) };
    this.valueType = null;
  }

  componentDidMount() {
    const { field } = this.props;
    if (field.get('fields')) {
      this.valueType = valueTypes.MULTIPLE;
    } else if (field.get('field')) {
      this.valueType = valueTypes.SINGLE;
    }
  }

  componentWillUpdate(nextProps) {
    if (this.props.field === nextProps.field) return;

    if (nextProps.field.get('fields')) {
      this.valueType = valueTypes.MULTIPLE;
    } else if (nextProps.field.get('field')) {
      this.valueType = valueTypes.SINGLE;
    }
  }

  handleChange = (e) => {
    const { onChange } = this.props;
    const oldValue = this.state.value;
    const newValue = e.target.value;
    const listValue = e.target.value.split(',');
    if (newValue.match(/,$/) && oldValue.match(/, $/)) {
      listValue.pop();
    }
    
    const parsedValue = valueToString(listValue);
    this.setState({ value: parsedValue });
    onChange(listValue.map(val => val.trim()));
  };

  handleCleanup = (e) => {
    const listValue = e.target.value.split(',').map(el => el.trim()).filter(el => el);
    this.setState({ value: valueToString(listValue) });
  };

  handleAdd = (e) => {
    e.preventDefault();
    const { value, onChange } = this.props;
    const parsedValue = (this.valueType === valueTypes.SINGLE) ? null : Map();
    onChange((value || List()).push(parsedValue));
  };

  handleChangeFor(index) {
    return (newValue, newMetadata) => {
      const { value, metadata, onChange, forID } = this.props;
      const parsedValue = (this.valueType === valueTypes.SINGLE) ? newValue.first() : newValue;
      const parsedMetadata = {
        [forID]: Object.assign(metadata ? metadata.toJS() : {}, newMetadata ? newMetadata[forID] : {}),
      };
      onChange(value.set(index, parsedValue), parsedMetadata);
    };
  }

  handleRemove(index) {
    return (e) => {
      e.preventDefault();
      const { value, metadata, onChange, forID } = this.props;
      const parsedMetadata = metadata && { [forID]: metadata.removeIn(value.get(index).valueSeq()) };
      onChange(value.remove(index), parsedMetadata);
    };
  }

  handleToggle(index) {
    return (e) => {
      e.preventDefault();
      const { itemsCollapsed } = this.state;
      this.setState({
        itemsCollapsed: itemsCollapsed.set(index, !itemsCollapsed.get(index, false)),
      });
    };
  }

  objectLabel(item) {
    const { field } = this.props;
    const multiFields = field.get('fields');
    const singleField = field.get('field');
    const labelField = (multiFields && multiFields.first()) || singleField;
    const value = multiFields ? item.get(multiFields.first().get('name')) : singleField.get('label');
    return value || `No ${ labelField.get('name') }`;
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { value, onChange } = this.props;

    // Update value
    const item = value.get(oldIndex);
    const newValue = value.delete(oldIndex).insert(newIndex, item);
    this.props.onChange(newValue);

    // Update collapsing
    const { itemsCollapsed } = this.state;
    const collapsed = itemsCollapsed.get(oldIndex);
    const newItemsCollapsed = itemsCollapsed.delete(oldIndex).insert(newIndex, collapsed);
    this.setState({ itemsCollapsed: newItemsCollapsed });
  };

  renderItem = (item, index) => {
    const { field, getAsset, onAddAsset, onRemoveAsset } = this.props;
    const { itemsCollapsed } = this.state;
    const collapsed = itemsCollapsed.get(index);
    const classNames = ['nc-listControl-item', collapsed ? 'nc-listControl-collapsed' : 'nc-listControl-expanded'];

    return (<SortableListItem className={classNames.join(' ')} index={index} key={`item-${ index }`}>
      <button className="nc-listControl-toggleButton" onClick={this.handleToggle(index)}>
        <FontIcon value={collapsed ? 'expand_more' : 'expand_less'} />
      </button>
      <DragHandle />
      <button className="nc-listControl-removeButton" onClick={this.handleRemove(index)}>
        <FontIcon value="close" />
      </button>
      <div className="nc-listControl-objectLabel">{this.objectLabel(item)}</div>
      <ObjectControl
        value={item}
        field={field}
        className="nc-listControl-objectControl"
        onChange={this.handleChangeFor(index)}
        getAsset={getAsset}
        onAddAsset={onAddAsset}
        onRemoveAsset={onRemoveAsset}
      />
    </SortableListItem>);
  };

  renderListControl() {
    const { value, forID, field } = this.props;
    const listLabel = field.get('label');

    return (<div id={forID}>
      <SortableList
        items={value || List()}
        renderItem={this.renderItem}
        onSortEnd={this.onSortEnd}
        useDragHandle
        lockAxis="y"
      />
      <button className="nc-listControl-addButton" onClick={this.handleAdd}>
        <FontIcon value="add" className="nc-listControl-addButtonIcon" />
        <span className="nc-listControl-addButtonText">new {listLabel}</span>
      </button>
    </div>);
  }

  render() {
    const { field, forID } = this.props;
    const { value } = this.state;

    if (field.get('field') || field.get('fields')) {
      return this.renderListControl();
    }

    return (<input
      type="text"
      id={forID}
      value={value}
      onChange={this.handleChange}
      onBlur={this.handleCleanup}
    />);
  }
};
