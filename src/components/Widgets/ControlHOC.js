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
    onAsyncValidate: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  processInnerControlRef = (wrappedControl) => {
    if (!wrappedControl) return;
    this.wrappedControlValid = wrappedControl.isValid || truthy;
  };

  isValid = (skipWrapped = false) => {
    const { field, value } = this.props;
    const errors = [];
    const validations = [this.validatePresence, this.validatePattern];
    validations.forEach((func) => {
      const response = func(field, value);
      if (response.error) errors.push(response.error);
    });
    if (skipWrapped) {
      if (skipWrapped.error) errors.push(skipWrapped.error);
    } else {
      const wrappedError = this.validateWrappedControl(field);
      if (wrappedError.error) errors.push(wrappedError.error);
    }
    return errors;
  };

  validatePresence(field, value) {
    const isRequired = field.get('required', true);
    if (isRequired && (value === null || value.length === 0)) {
      return { error: true };
    }
    return { error: false };  
  }

  validatePattern(field, value) {
    const pattern = field.get('pattern', false);
    if (pattern && !RegExp(pattern.first()).test(value)) {
      return { error: `${ field.get('label', field.get('name')) } didn't match the pattern: ${ pattern.last() }` };
    }
    return { error: false };
  }

  validateWrappedControl = (field) => {
    const response = this.wrappedControlValid();
    if (typeof response === "boolean") {
      return response;
    } else if (response instanceof Promise) {
      response.then(
        () => { this.props.onAsyncValidate(this.isValid({ error: false })); },
        (error) => { 
          this.props.onAsyncValidate(this.isValid({ error: `${ field.get('label', field.get('name')) } - ${ error }.` }));
        }
      );
      return { error: `${ field.get('label', field.get('name')) } is processing.` };
    }
    return { error: false };
  };

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
