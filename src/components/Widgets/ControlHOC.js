import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";

const truthy = () => ({ error: false });

class ControlHOC extends Component {

  static propTypes = {
    controlComponent: PropTypes.func.isRequired,
    field: ImmutablePropTypes.map.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.string,
      PropTypes.bool,
    ]),
    metadata: ImmutablePropTypes.map,
    onChange: PropTypes.func.isRequired,
    onValidate: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  processInnerControlRef = (wrappedControl) => {
    if (!wrappedControl) return;
    this.wrappedControlValid = wrappedControl.isValid || truthy;
  };

  validate = (skipWrapped = false) => {
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
    this.props.onValidate(errors);
  };

  validatePresence(field, value) {
    const isRequired = field.get('required', true);
    if (isRequired && (
      value === null ||
      value === undefined ||
      (value.hasOwnProperty('length') && value.length === 0) ||
      (value.constructor === Object && Object.keys(value).length === 0)
    )) {
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
      const isValid = response;
      return { error: (!isValid) };
    } else if (response.hasOwnProperty('error')) {
      return response;
    } else if (response instanceof Promise) {
      response.then(
        () => { this.validate({ error: false }); },
        (error) => { 
          this.validate({ error: `${ field.get('label', field.get('name')) } - ${ error }.` });
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
      forID: field.get('name'),
      ref: this.processInnerControlRef,
    });
  }
}

export default ControlHOC;
