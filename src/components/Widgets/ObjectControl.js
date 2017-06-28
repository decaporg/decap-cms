import React, { Component, PropTypes } from 'react';
import { Map } from 'immutable';
import { resolveWidget } from '../Widgets';
import controlStyles from '../ControlPanel/ControlPane.css';
import styles from './ObjectControl.css';

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

  controlFor(field) {
    const { onAddAsset, onRemoveAsset, getAsset, value, onChange } = this.props;
    if (field.get('widget') === 'hidden') {
      return null;
    }
    const widget = resolveWidget(field.get('widget') || 'string');
    const fieldValue = value && Map.isMap(value) ? value.get(field.get('name')) : value;

    return (<div className={controlStyles.widget} key={field.get('name')}>
      <div className={controlStyles.control} key={field.get('name')}>
        <label className={controlStyles.label} htmlFor={field.get('name')}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            id: field.get('name'),
            field,
            value: fieldValue,
            onChange: (val, metadata) => {
              onChange((value || Map()).set(field.get('name'), val), metadata);
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
      return (<div id={forID} className={`${ className } ${ styles.root }`}>
        {multiFields.map(f => this.controlFor(f))}
      </div>);
    } else if (singleField) {
      return this.controlFor(singleField);
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
