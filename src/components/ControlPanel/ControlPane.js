import React, { Component, PropTypes } from 'react';
import { Map, fromJS } from 'immutable';
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

  isValid = () => {
    const errors = this.props.fields.reduce((acc, field) => {
      const fieldErrors = this.componentValidation[field.get("name")]();
      if (fieldErrors.length > 0) {
        return acc.set(field.get("name"), fromJS(fieldErrors));
      }
      return acc;
    }, Map());
    this.props.onValidate(errors);
    return errors.isEmpty();
  };

  handleAsyncFieldValidation = (field, errors) => {
    const { fieldsErrors } = this.props;
    if (errors.length > 0) {
      this.props.onValidate(fieldsErrors.set(field, fromJS(errors)));
    } else {
      this.props.onValidate(fieldsErrors.delete(field));
    }
  };

  controlFor(field) {
    const { entry, fieldsMetaData, fieldsErrors, getAsset, onChange, onAddAsset, onRemoveAsset } = this.props;
    const widget = resolveWidget(field.get('widget'));
    const fieldName = field.get('name');
    const value = entry.getIn(['data', fieldName]);
    const metadata = fieldsMetaData.get(fieldName);
    const errors = fieldsErrors.get(fieldName);
    const labelClass = errors ? styles.labelWithError : styles.label;
    if (entry.size === 0 || entry.get('partial') === true) return null;
    return (
      <div className={styles.control}>
        <label className={labelClass} htmlFor={fieldName}>{field.get('label')}</label>
        <ul className={styles.errors}>
          {
            errors && errors.map(error => (
              typeof error === 'string' && <li key={error.trim().replace(/[^a-z0-9]+/gi, '-')}>{error}</li>
            ))
          }
        </ul>
        <ControlHOC 
          controlComponent={widget.control}
          field={field}
          value={value}
          metadata={metadata}
          onChange={(newValue, newMetadata) => onChange(fieldName, newValue, newMetadata)}
          onAsyncValidate={this.handleAsyncFieldValidation.bind(this, fieldName)}
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
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  getAsset: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
};
