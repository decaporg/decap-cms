import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";

const truthy = () => ({ error: false });

class ControlHOC extends Component {

  static propTypes = {
    controlComponent: PropTypes.func.isRequired,
    field: ImmutablePropTypes.map.isRequired,
    value: PropTypes.node,
    metadata: ImmutablePropTypes.map,
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  processInnerControlRef = (wrappedControl) => {
    if (!wrappedControl) return;
    this.innerControlValid = wrappedControl.isValid || truthy;
  };

  isValid = () => {
    const { field, value } = this.props;
    const errors = [];
    const validations = [this.validatePresence, this.validatePattern, this.innerControlValid];
    validations.forEach((func) => {
      const response = func(field, value);
      if (response.error) errors.push(response.error);
    });
    return errors.length === 0;
  };

  validatePresence(field, value) {
    const isRequired = field.get('required', true);
    if (isRequired && (value === null || value.length === 0)) {
      return { error: `${ field.get('title', field.get('name')) } is required.` };
    }
    return { error: false };  
  }

  validatePattern(field, value) {
    const pattern = field.get('pattern', false);
    if (pattern && !RegExp(pattern).test(value)) {
      return { error: `${ field.get('title', field.get('name')) } didn't match the pattern: ${ field.get('patternTitle') }` };
    }
    return { error: false };
  }

  render() {
    const { controlComponent, field, value, metadata, onChange, onAddAsset, onRemoveAsset, getAsset } = this.props;
    return React.createElement(controlComponent, {
      field,
      value,
      metadata,
      onChange,
      onAddAsset,
      onRemoveAsset,
      getAsset,
      ref: this.processInnerControlRef,
    });
  }
}

export default ControlHOC;
