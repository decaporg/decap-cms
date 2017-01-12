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
    if (this.props.value && this.props.value.length > 3) {
      return true;
    }
    return false;
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
