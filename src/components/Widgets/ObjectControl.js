import React, { Component, PropTypes } from 'react';
import { Map } from 'immutable';
import { resolveWidget } from '../Widgets';
import controlStyles from '../ControlPanel/ControlPane.css';
import styles from './ObjectControl.css';

export default class ObjectControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddMedia: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
  };

  controlFor(field) {
    const { onAddMedia, onRemoveMedia, getMedia, value, onChange } = this.props;
    const widget = resolveWidget(field.get('widget') || 'string');
    const fieldValue = value && value.get(field.get('name'));

    return (<div className={controlStyles.widget} key={field.get('name')}>
      <div className={controlStyles.control} key={field.get('name')}>
        <label className={controlStyles.label}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            field,
            value: fieldValue,
            onChange: (val) => {
              onChange((value || Map()).set(field.get('name'), val));
            },
            onAddMedia,
            onRemoveMedia,
            getMedia,
          })
        }
      </div>
    </div>);
  }

  render() {
    const { field } = this.props;
    const fields = field.get('fields');

    if (!fields) {
      return <h3>No fields defined for this widget</h3>;
    }

    return (<div className={styles.root}>
      {field.get('fields').map(field => this.controlFor(field))}
    </div>);
  }
}
