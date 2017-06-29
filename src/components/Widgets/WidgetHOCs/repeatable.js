import React, { Component, PropTypes } from 'react';
import { fromJS, List, Map } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { sortable } from 'react-sortable';
import FontIcon from 'react-toolbox/lib/font_icon';
import styles from './repeatable.css';

const RepeatableItem = sortable(
  props => <div {...props}>{props.children}</div>
);

const repeatable = WrappedComponent =>
  class extends Component {
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
      this.state = {};
    }

    handleChangeFor = (index) => {
      return (newValueForIndex, newMetadata) => {
        const { value, onChange } = this.props;
        const newValue = value.set(index, newValueForIndex);
        onChange(fromJS(newValue));
      };
    };

    handleRemoveFor = (index) => {
      return (e) => {
        e.preventDefault();
        const { value, metadata, onChange, forID } = this.props;
        const parsedMetadata = metadata && {
          [forID]: metadata.removeIn(value.get(index).valueSeq()),
        };
        onChange(value.remove(index), parsedMetadata);
      };
    };

    handleAdd = (e) => {
      e.preventDefault();
      const { value, onChange } = this.props;
      onChange((value || List()).push(null));
    }

    handleSort = (obj) => {
      this.setState({ draggingIndex: obj.draggingIndex });
      if (obj.items) {
        this.props.onChange(fromJS(obj.items));
      }
    };

    renderItem = (item, index) => {
      return (<RepeatableItem
        key={index}
        sortId={index}
        draggingIndex={this.state.draggingIndex}
        outline="list"
        updateState={this.handleSort}
        items={this.props.value ? this.props.value.toJS() : []}
      >
        <FontIcon value="drag_handle" className={styles.dragIcon} />
        <button className={styles.removeButton} onClick={this.handleRemoveFor(index)}>
          <FontIcon value="close" />
        </button>
        <WrappedComponent
          {...this.props}
          className={styles.repeatedComponent}
          value={item}
          onChange={this.handleChangeFor(index)}
        />
      </RepeatableItem>);
    };

    renderItems() {
      const { value, forID } = this.props;
      return (<div id={forID}>
        {value && value.map(this.renderItem).toJS()}
        <button className={styles.addButton} onClick={this.handleAdd}>=
          <FontIcon value="add" className={styles.addButtonText} />
          <span className={styles.addButtonText}>new</span>
        </button>
      </div>);
    }

    render() {
      if (this.props.field.get("repeat", false)) {
        return <div id={this.props.forID}>{this.renderItems()}</div>;
      }

      return <WrappedComponent {...this.props} />;
    }
  };

export default repeatable;
