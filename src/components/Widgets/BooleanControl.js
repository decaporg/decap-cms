import React, { PropTypes } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import Switch from 'react-toolbox/lib/switch';

export default class BooleanControl extends React.Component {
  render() {
    const { value, field, forID, onChange } = this.props;
    return (
      <Switch
        id={forID}
        checked={value === undefined ? field.get('defaultValue', false) : value}
        onChange={onChange}
      />
    );
  }
}

BooleanControl.propTypes = {
  field: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.bool,
};
