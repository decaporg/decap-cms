import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { resolveWidget } from '../Widgets';
import styles from './ControlPane.css';

export default class ControlPane extends Component {

  controlFor(field) {
    const { entry, getMedia, onChange, onAddMedia, onRemoveMedia } = this.props;
    const widget = resolveWidget(field.get('widget'));
    const fieldName = field.get('name');
    const value = entry.getIn(['data', fieldName]);
    if (entry.size === 0) return null;

    return (
      <div className={styles.control}>
        <label className={styles.label} htmlFor={fieldName}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            field,
            value,
            onChange: val => onChange(entry.setIn(['data', fieldName], val)),
            onAddMedia,
            onRemoveMedia,
            getMedia,
          })
        }
      </div>
    );
  }

  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }
    return (
      <div>
        {
          collection
            .get('fields')
            .map(field =>
              <div
                key={field.get('name')}
                className={styles.widget}
              >
                {this.controlFor(field)}
              </div>
            )
        }
      </div>
    );
  }
}

ControlPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
};
