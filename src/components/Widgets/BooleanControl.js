import React, { PropTypes } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import Switch from 'react-toolbox/lib/switch';

export default class BooleanControl extends React.Component {

  handleChange = (e) => {
    this.props.onChange(e);
  };

  render() {
    const finalValue = (this.props.value !== undefined) ? this.props.value : this.props.field.get('defaultValue', false);

    return (<Switch
      id={this.props.forID}
      checked={finalValue}
      onChange={this.handleChange}
    />);
  }
}

BooleanControl.propTypes = {
  field: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string.isRequired,
  value: PropTypes.bool,
};
