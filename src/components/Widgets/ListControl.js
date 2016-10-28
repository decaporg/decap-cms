import React, { Component, PropTypes } from 'react';
import { List, Map } from 'immutable';
import ObjectControl from './ObjectControl';
import styles from './ListControl.css';

export default class ListControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.state = {itemStates: Map()};
  }

  handleChange = (e) => {
    this.props.onChange(e.target.value.split(',').map(item => item.trim()));
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
    return value || `No ${first.get('name')}`;
  }

  renderItem(item, index) {
    const { field, getMedia, onAddMedia, onRemoveMedia } = this.props;
    const { itemStates } = this.state;
    const collapsed = itemStates.getIn([index, 'collapsed']);
    const classNames = [styles.item, collapsed ? styles.collapsed : styles.expanded];

    return (<div key={index} className={classNames.join(' ')}>
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
    </div>);
  }

  renderListControl() {
    const { value } = this.props;
    return (<div>
      {value && value.map((item, index) => this.renderItem(item, index))}
      <div><button className={styles.addButton} onClick={this.handleAdd}>new</button></div>
    </div>);
  }

  render() {
    const { value, field } = this.props;
    console.log('field: %o', field.toJS());

    if (field.get('fields')) {
      return this.renderListControl();
    }

    return <input type="text" value={value ? value.join(', ') : ''} onChange={this.handleChange} />;
  }
}
