import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Map } from 'immutable';
import { resolveWidget } from '../Widgets';

export default class ObjectControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.bool,
    ]),
    field: PropTypes.object,
    forID: PropTypes.string,
    className: PropTypes.string,
  };

  /**
   * In case the `onChange` function is frozen by a child widget implementation,
   * e.g. when debounced, always get the latest object value instead of usin
   * `this.props.value` directly.
   */
  getObjectValue = () => this.props.value;

  controlFor(field) {
    const { onAddAsset, onRemoveAsset, getAsset, value, onChange } = this.props;
    if (field.get('widget') === 'hidden') {
      return null;
    }
    const widget = resolveWidget(field.get('widget') || 'string');
    const fieldValue = value && Map.isMap(value) ? value.get(field.get('name')) : value;

    return (<div className="nc-controlPane-widget" key={field.get('name')}>
      <div className="nc-controlPane-control" key={field.get('name')}>
        <label className="nc-controlPane-label" htmlFor={field.get('name')}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            id: field.get('name'),
            field,
            value: fieldValue,
            onChange: (val, metadata) => {
              onChange((this.getObjectValue() || Map()).set(field.get('name'), val), metadata);
            },
            onAddAsset,
            onRemoveAsset,
            getAsset,
            forID: field.get('name'),
          })
        }
      </div>
    </div>);
  }

  render() {
    const { field, forID } = this.props;
    const multiFields = field.get('fields');
    const singleField = field.get('field');
    const className = this.props.className || '';

    if (multiFields) {
      return (<div id={forID} className={`${ className } nc-objectControl-root`}>
        {multiFields.map(f => this.controlFor(f))}
      </div>);
    } else if (singleField) {
      return this.controlFor(singleField);
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
