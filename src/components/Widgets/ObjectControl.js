import React, { Component, PropTypes } from 'react';
import { Map } from 'immutable';
import { resolveWidget } from '../Widgets';
import controlStyles from '../ControlPanel/ControlPane.css';
import styles from './ObjectControl.css';

export default class ObjectControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.object,
    forID: PropTypes.string.isRequired,
  };

  controlFor(field) {
    const { onAddAsset, onRemoveAsset, getAsset, value, onChange } = this.props;
    const widget = resolveWidget(field.get('widget') || 'string');
    const fieldValue = value && Map.isMap(value) ? value.get(field.get('name')) : value;

    return (<div className={controlStyles.widget} key={field.get('name')}>
      <div className={controlStyles.control} key={field.get('name')}>
        <label className={controlStyles.label}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            field,
            value: fieldValue,
            onChange: (val, metadata) => {
              onChange((value || Map()).set(field.get('name'), val), metadata);
            },
            onAddAsset,
            onRemoveAsset,
            getAsset,
          })
        }
      </div>
    </div>);
  }

  render() {
    const { field, forID } = this.props;
    const multiFields = field.get('fields');
    const singleField = field.get('field');

    if (multiFields) {
      return (<div id={forID} className={styles.root}>
        {multiFields.map(field => this.controlFor(field))}
      </div>);
    } else if (singleField) {
      return this.controlFor(singleField);
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
