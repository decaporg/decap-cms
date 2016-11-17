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

export default class ListControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
    getMedia: PropTypes.func.isRequired,
    onAddMedia: PropTypes.func.isRequired,
    onRemoveMedia: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { itemStates: Map(), value: valueToString(props.value) };
  }

  handleChange = (e) => {
    const oldValue = this.state.value;
    const newValue = e.target.value;
    const listValue = e.target.value.split(',');
    if (newValue.match(/,$/) && oldValue.match(/, $/)) {
      listValue.pop();
    }

    this.setState({ value: valueToString(listValue) });
    this.props.onChange(listValue);
  };

  handleCleanup = (e) => {
    const listValue = e.target.value.split(',').map(el => el.trim()).filter(el => el);
    this.setState({ value: valueToString(listValue) });
    this.props.onChange(listValue);
  };

  handleAdd = (e) => {
    e.preventDefault();
    const { value, onChange } = this.props;

    onChange((value || List()).push(Map()));
  };

  handleChangeFor(index) {
    return (newValue) => {
      const { value, onChange } = this.props;
      onChange(value.set(index, newValue));
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
    const fields = field.get('fields');
    const first = fields.first();
    const value = item.get(first.get('name'));
    return value || `No ${ first.get('name') }`;
  }

  handleSort = (obj) => {
    this.setState({ draggingIndex: obj.draggingIndex });
    if ('items' in obj) {
      this.props.onChange(fromJS(obj.items));
    }
  };

  renderItem(item, index) {
    const { value, field, getMedia, onAddMedia, onRemoveMedia } = this.props;
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
            getMedia={getMedia}
            onAddMedia={onAddMedia}
            onRemoveMedia={onRemoveMedia}
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
    const { value } = this.props;
    return (<div>
      {value && value.map((item, index) => this.renderItem(item, index))}
      <div><button className={styles.addButton} onClick={this.handleAdd}>new</button></div>
    </div>);
  }

  render() {
    const { field } = this.props;
    const { value } = this.state;

    if (field.get('fields')) {
      return this.renderListControl();
    }

    return (<input
      type="text"
      value={value}
      onChange={this.handleChange}
      onBlur={this.handleCleanup}
    />);
  }
}
