import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import { isBoolean } from 'lodash';
import { Toggle } from 'UI';

export default class BooleanControl extends React.Component {
  render() {
    const {
      value,
      field,
      forID,
      onChange,
      className,
      setActiveStyle,
      setInactiveStyle
    } = this.props;
    return (
      <div className={`${className} nc-booleanControl-switch`}>
        <Toggle
          id={forID}
          active={isBoolean(value) ? value : field.get('defaultValue', false)}
          onChange={onChange}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
        />
      </div>
    );
  }
}

BooleanControl.propTypes = {
  field: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  setActiveStyle: PropTypes.func.isRequired,
  setInactiveStyle: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.bool,
};
