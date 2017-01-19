import React, { Component, PropTypes } from 'react';
import { List, Map, fromJS } from 'immutable';
import { sortable } from 'react-sortable';
import ObjectControl from './ObjectControl';
import styles from './ListControl.css';

function ListItem(props) {
  return <div {...props} className={`list-item ${ props.className }`}>{props.children}</div>;
}
ListItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
ListItem.displayName = 'list-item';

function valueToString(value) {
  return value ? value.join(',').replace(/,([^\s]|$)/g, ', $1') : '';
}

const SortableListItem = sortable(ListItem);

const valueTypes = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
};

export default class ListControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
    forID: PropTypes.string.isRequired,
    getAsset: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { itemStates: Map(), value: valueToString(props.value) };
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
      const { value, onChange } = this.props;
      const parsedValue = (this.valueType === valueTypes.SINGLE) ? newValue.first() : newValue;
      onChange(value.set(index, parsedValue), newMetadata);
    };
  }

  handleRemove(index) {
    return (e) => {
      e.preventDefault();
      const { value, onChange } = this.props;
      onChange(value.remove(index));
    };
  }

  handleToggle(index) {
    return (e) => {
      e.preventDefault();
      const { itemStates } = this.state;
      this.setState({
        itemStates: itemStates.setIn([index, 'collapsed'], !itemStates.getIn([index, 'collapsed'])),
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

  handleSort = (obj) => {
    this.setState({ draggingIndex: obj.draggingIndex });
    if ('items' in obj) {
      this.props.onChange(fromJS(obj.items));
    }
  };

  renderItem(item, index) {
    const { value, field, getAsset, onAddAsset, onRemoveAsset } = this.props;
    const { itemStates } = this.state;
    const collapsed = itemStates.getIn([index, 'collapsed']);
    const classNames = [styles.item, collapsed ? styles.collapsed : styles.expanded];

    return (<SortableListItem
      key={index}
      updateState={this.handleSort} // eslint-disable-line
      items={value ? value.toJS() : []}
      draggingIndex={this.state.draggingIndex}
      sortId={index}
      outline="list"
    >
      <div className={classNames.join(' ')}>
        <div className={styles.objectLabel}>{this.objectLabel(item)}</div>
        <div className={styles.objectControl}>
          <ObjectControl
            value={item}
            field={field}
            onChange={this.handleChangeFor(index)}
            getAsset={getAsset}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
          />
        </div>
        <button className={styles.toggleButton} onClick={this.handleToggle(index)}>
          {collapsed ? '+' : '-'}
        </button>
        <button className={styles.removeButton} onClick={this.handleRemove(index)}>x</button>
      </div>
    </SortableListItem>);
  }

  renderListControl() {
    const { value, forID } = this.props;
    return (<div id={forID}>
      {value && value.map((item, index) => this.renderItem(item, index))}
      <div><button className={styles.addButton} onClick={this.handleAdd}>new</button></div>
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
}
