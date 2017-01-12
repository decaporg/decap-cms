import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { resolveWidget } from '../Widgets';
import ControlHOC from '../Widgets/ControlHOC';
import styles from './ControlPane.css';

function isHidden(field) {
  return field.get('widget') === 'hidden';
}

export default class ControlPane extends Component {
  componentValidation = {};
  processControlRef(fieldName, wrappedControl) {
    if (!wrappedControl) return;
    this.componentValidation[fieldName] = wrappedControl.isValid;
  }

  isValid = () => this.props.fields.reduce((acc, field) => {
    const componentIsValid = this.componentValidation[field.get("name")]();
    return acc && componentIsValid;
  }, true);

  controlFor(field) {
    const { entry, fieldsMetaData, getAsset, onChange, onAddAsset, onRemoveAsset } = this.props;
    const widget = resolveWidget(field.get('widget'));
    const fieldName = field.get('name');
    const value = entry.getIn(['data', fieldName]);
    const metadata = fieldsMetaData.get(fieldName);
    if (entry.size === 0 || entry.get('partial') === true) return null;
    return (
      <div className={styles.control}>
        <label className={styles.label} htmlFor={fieldName}>{field.get('label')}</label>
        <ControlHOC 
          controlComponent={widget.control}
          field={field}
          value={value}
          metadata={metadata}
          onChange={(newValue, newMetadata) => onChange(fieldName, newValue, newMetadata)}
          onAddAsset={onAddAsset}
          onRemoveAsset={onRemoveAsset}
          getAsset={getAsset}
          ref={this.processControlRef.bind(this, fieldName)}
        />
      </div>
    );
  }

  render() {
    const { collection, fields } = this.props;
    if (!collection || !fields) {
      return null;
    }

    return (
      <div>
        {
          fields.map((field) => {
            if (isHidden(field)) {
              return null;
            }
            return <div key={field.get('name')} className={styles.widget}>{this.controlFor(field)}</div>;
          })
        }
      </div>
    );
  }
}

ControlPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  getAsset: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
};
