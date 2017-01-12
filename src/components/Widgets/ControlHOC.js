import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";

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

  isValid = () => {
    const { field, value } = this.props;
    let valid = true;
    const isRequired = field.get('required', true);
    const pattern = field.get('pattern', false);
    if (isRequired) valid = valid && (value !== null && value.length > 0);
    if (pattern) valid = valid && RegExp(pattern).test(value);
    return valid;
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
    });
  }
}

export default ControlHOC;
