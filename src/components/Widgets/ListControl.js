import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List, Map, fromJS } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import Icon from '../../icons/Icon';
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

const DragHandle = SortableHandle(() => (
  <span className="nc-listControl-dragIcon">
    <Icon type="drag-handle" size="small"/>
  </span>
));

const ItemTopBar = ({ index, collapsed, onCollapseToggle, onRemove }) => (
  <div className="nc-listControl-dragHandle">
    <button className="nc-listControl-toggleButton" onClick={onCollapseToggle(index)}>
      <Icon type="caret" size="small" direction={collapsed ? 'up' : 'down'}/>
    </button>
    <DragHandle/>
    <button className="nc-listControl-removeButton" onClick={onRemove(index)}>
      <Icon type="close" size="small"/>
    </button>
  </div>
);

const TopBar = ({ onAdd, listLabel, collapsed, onCollapseToggle, itemsCount }) => (
  <div className="nc-listControl-topBar">
    <div className="nc-listControl-listCollapseToggle" onClick={onCollapseToggle}>
      <Icon type="caret" direction={collapsed ? 'up' : 'down'} size="small"/>
      {itemsCount} {listLabel}
    </div>
    <button className="nc-listControl-addButton" onClick={onAdd}>
      Add {listLabel} <Icon type="add" size="xsmall" />
    </button>
  </div>
);

const SortableList = SortableContainer(({ items, renderItem }) => (
  <div>{items.map(renderItem)}</div>
));

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
    mediaPaths: ImmutablePropTypes.map.isRequired,
    getAsset: PropTypes.func.isRequired,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
      itemsCollapsed: List(),
      value: valueToString(props.value),
    };
    this.valueType = null;
  }

  /**
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate() {
    return true;
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
    this.setState({ collapsed: false });
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

  handleRemove = index => {
    return (e) => {
      e.preventDefault();
      const { value, metadata, onChange, forID } = this.props;
      const parsedMetadata = metadata && { [forID]: metadata.removeIn(value.get(index).valueSeq()) };
      onChange(value.remove(index), parsedMetadata);
    };
  }

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  }

  handleItemCollapseToggle = index => {
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
    const { field, getAsset, mediaPaths, onOpenMediaLibrary, onAddAsset, onRemoveAsset } = this.props;
    const { itemsCollapsed } = this.state;
    const collapsed = itemsCollapsed.get(index);
    const classNames = ['nc-listControl-item', collapsed ? 'nc-listControl-collapsed' : ''];

    return (<SortableListItem className={classNames.join(' ')} index={index} key={`item-${ index }`}>
      <ItemTopBar
        index={index}
        collapsed={collapsed}
        onCollapseToggle={this.handleItemCollapseToggle}
        onRemove={this.handleRemove}
      />
      <div className="nc-listControl-objectLabel">{this.objectLabel(item)}</div>
      <ObjectControl
        value={item}
        field={field}
        className="nc-listControl-objectControl"
        onChange={this.handleChangeFor(index)}
        getAsset={getAsset}
        onOpenMediaLibrary={onOpenMediaLibrary}
        mediaPaths={mediaPaths}
        onAddAsset={onAddAsset}
        onRemoveAsset={onRemoveAsset}
      />
    </SortableListItem>);
  };

  renderListControl() {
    const { value, forID, field } = this.props;
    const { collapsed } = this.state;
    const items = value || List();

    return (
      <div id={forID} className={c('nc-listControl', { 'nc-listControl-collapsed' : collapsed })}>
        <TopBar
          onAdd={this.handleAdd}
          listLabel={field.get('label').toLowerCase()}
          onCollapseToggle={this.handleCollapseToggle}
          collapsed={collapsed}
          itemsCount={items.size}
        />
        {
          collapsed ? null :
            <SortableList
              items={items}
              renderItem={this.renderItem}
              onSortEnd={this.onSortEnd}
              useDragHandle
              lockAxis="y"
            />
        }
      </div>
    );
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
