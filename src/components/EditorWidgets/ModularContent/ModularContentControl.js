import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List, Map } from 'immutable';
import { partial } from 'lodash';
import c from 'classnames';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, ListItemTopBar, Dropdown, DropdownItem } from 'UI';
import ObjectControl from 'EditorWidgets/Object/ObjectControl';

function ModularContentItem(props) {
  return (
    <div {...props} className={`list-item ${ props.className || '' }`}>
      {props.children}
    </div>
  );
}

ModularContentItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

ModularContentItem.displayName = 'list-item';

function valueToString(value) {
  return value ? value.join(',').replace(/,([^\s]|$)/g, ', $1') : '';
}

const SortableModularContentItem = SortableElement(ModularContentItem);

const getSingularLabel = (label) => {
  if (label.charAt(label.length - 1).toLowerCase() === 's') {
    label = label.substr(0, label.length - 1);
  }
  return label;
};

const TopBar = ({ onAdd, listLabel, onCollapseAllToggle, allItemsCollapsed, itemsCount, types }) => (
  <div className="nc-listControl-topBar">
    <div className="nc-listControl-listCollapseToggle">
      <button className="nc-listControl-listCollapseToggleButton" onClick={onCollapseAllToggle}>
        <Icon type="chevron" direction={allItemsCollapsed ? 'right' : 'down'} size="small" />
      </button>
      {itemsCount} {itemsCount === 1 ? getSingularLabel(listLabel) : listLabel}
    </div>
    <div className="nc-toolbar-dropdown" style={{zIndex:100}}>
      <Dropdown
        dropdownTopOverlap="24px"
        button={
          <button className="nc-listControl-addButton">
            Add {getSingularLabel(listLabel)} <Icon type="add" size="xsmall" />
          </button>
        }
      >
        {types &&
          types
            .toList()
            .map((itemType, idx) => (
              <DropdownItem key={idx} label={itemType.get('label')} onClick={() => onAdd({ itemType })} />
            ))}
      </Dropdown>
    </div>
  </div>
);

const SortableModularContent = SortableContainer(({ items, renderItem }) => <div>{items.map(renderItem)}</div>);

const valueTypes = {
  SINGLE: 'SINGLE',
};

export default class ModularContentControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onChangeObject: PropTypes.func.isRequired,
    value: ImmutablePropTypes.list,
    field: PropTypes.object,
    forID: PropTypes.string,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    getAsset: PropTypes.func.isRequired,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveInsertedMedia: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: List(),
  };

  constructor(props) {
    super(props);
    const { field, value } = props;
    const allItemsCollapsed = field.get('collapsed', true);
    const itemsCollapsed = value && Array(value.size).fill(allItemsCollapsed);
    this.state = {
      itemsCollapsed: List(itemsCollapsed),
      value: valueToString(value),
    };

    this.valueType = valueTypes.SINGLE;
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

  handleFocus = () => {
    this.props.setActiveStyle();
  };

  handleBlur = (e) => {
    const listValue = e.target.value
      .split(',')
      .map(el => el.trim())
      .filter(el => el);
    this.setState({ value: valueToString(listValue) });
    this.props.setInactiveStyle();
  };

  handleAdd = ({ itemType }) => {
    const { value, onChange } = this.props;
    const parsedValue = itemType;
    this.setState({ itemsCollapsed: this.state.itemsCollapsed.push(false) });
    onChange((value || List()).push(parsedValue));
  };

  /**
   * In case the `onChangeObject` function is frozen by a child widget implementation,
   * e.g. when debounced, always get the latest object value instead of using
   * `this.props.value` directly.
   */
  getObjectValue = idx => this.props.value.get(idx) || Map();

  handleChangeFor(index) {
    return (fieldName, newValue, newMetadata) => {
      const { value, metadata, onChange, forID } = this.props;
      const newObjectValue = this.getObjectValue(index).set(fieldName, newValue);
      const parsedValue = newObjectValue;
      const parsedMetadata = {
        [forID]: Object.assign(metadata ? metadata.toJS() : {}, newMetadata ? newMetadata[forID] : {}),
      };
      onChange(value.set(index, parsedValue), parsedMetadata);
    };
  }

  handleRemove = (index, event) => {
    event.preventDefault();
    const { itemsCollapsed } = this.state;
    const { value, metadata, onChange, forID } = this.props;
    const parsedMetadata = metadata && { [forID]: metadata.removeIn(value.get(index).valueSeq()) };

    this.setState({ itemsCollapsed: itemsCollapsed.delete(index) });

    onChange(value.remove(index), parsedMetadata);
  };

  handleItemCollapseToggle = (index, event) => {
    event.preventDefault();
    const { itemsCollapsed } = this.state;
    const collapsed = itemsCollapsed.get(index);
    this.setState({ itemsCollapsed: itemsCollapsed.set(index, !collapsed) });
  };

  handleCollapseAllToggle = (e) => {
    e.preventDefault();
    const { value } = this.props;
    const { itemsCollapsed } = this.state;
    const allItemsCollapsed = itemsCollapsed.every(val => val === true);
    this.setState({ itemsCollapsed: List(Array(value.size).fill(!allItemsCollapsed)) });
  };

  objectLabel(item) {
    const { field } = this.props;
    const value = item.get('name');
    const keys = item.keys();
    return value ? value.toString() : '';
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { value, onChange } = this.props;
    const { itemsCollapsed } = this.state;

    // Update value
    const item = value.get(oldIndex);
    const newValue = value.delete(oldIndex).insert(newIndex, item);
    this.props.onChange(newValue);

    // Update collapsing
    const collapsed = itemsCollapsed.get(oldIndex);
    const updatedItemsCollapsed = itemsCollapsed.delete(oldIndex).insert(newIndex, collapsed);
    this.setState({ itemsCollapsed: updatedItemsCollapsed });
  };

  renderItem = (item, index) => {
    const {
      field,
      getAsset,
      mediaPaths,
      onOpenMediaLibrary,
      onAddAsset,
      onRemoveInsertedMedia,
      classNameWrapper,
    } = this.props;
    const { itemsCollapsed } = this.state;
    const collapsed = itemsCollapsed.get(index);
    const classNames = ['nc-listControl-item', collapsed ? 'nc-listControl-collapsed' : ''];

    return (
      <SortableModularContentItem className={classNames.join(' ')} index={index} key={`item-${ index }`}>
        <ListItemTopBar
          className="nc-listControl-itemTopBar"
          collapsed={collapsed}
          onCollapseToggle={partial(this.handleItemCollapseToggle, index)}
          onRemove={partial(this.handleRemove, index)}
          dragHandleHOC={SortableHandle}
        />
        <div className="nc-listControl-objectLabel">{this.objectLabel(item, field)}</div>
        <ObjectControl
          value={item}
          field={field}
          onChangeObject={this.handleChangeFor(index)}
          getAsset={getAsset}
          onOpenMediaLibrary={onOpenMediaLibrary}
          mediaPaths={mediaPaths}
          onAddAsset={onAddAsset}
          onRemoveInsertedMedia={onRemoveInsertedMedia}
          classNameWrapper={`${ classNameWrapper } nc-listControl-objectControl`}
          forList
        />
      </SortableModularContentItem>
    );
  };

  renderModularContentControl() {
    const { value, forID, field, classNameWrapper } = this.props;
    const { itemsCollapsed } = this.state;
    const items = value || List();
    const label = field.get('label');
    const types = field.get('types');
   

    return (
      <div id={forID} className={c(classNameWrapper, 'nc-listControl')}>
        <TopBar
          types={types}
          onAdd={this.handleAdd}
          listLabel={label.toLowerCase()}
          onCollapseAllToggle={this.handleCollapseAllToggle}
          allItemsCollapsed={itemsCollapsed.every(val => val === true)}
          itemsCount={items.size}
        />
        <SortableModularContent
          items={items}
          renderItem={this.renderItem}
          onSortEnd={this.onSortEnd}
          useDragHandle
          lockAxis="y"
        />
      </div>
    );
  }

  render() {
    const { field, forID, classNameWrapper } = this.props;
    const { value } = this.state;

    if (field.get('types')) {
      return this.renderModularContentControl();
    }

    return (
      <input
        type="text"
        id={forID}
        value={value}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        className={classNameWrapper}
      />
    );
  }
}
