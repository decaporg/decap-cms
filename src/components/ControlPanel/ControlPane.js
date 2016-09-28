import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { resolveWidget } from '../Widgets';
import styles from './ControlPane.css';

export default class ControlPane extends React.Component {
  controlFor(field) {
    const { entry, getMedia, onChange, onAddMedia, onRemoveMedia } = this.props;
    const widget = resolveWidget(field.get('widget'));
    return (
      <div className={styles.control}>
        <label className={styles.label}>{field.get('label')}</label>
        {React.createElement(widget.control, {
          field: field,
          value: entry.getIn(['data', field.get('name')]),
          onChange: (value) => onChange(entry.setIn(['data', field.get('name')], value)),
          onAddMedia: onAddMedia,
          onRemoveMedia: onRemoveMedia,
          getMedia: getMedia
        })}
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
