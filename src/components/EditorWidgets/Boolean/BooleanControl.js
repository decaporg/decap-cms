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
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;
    return (
      <div className={`${classNameWrapper} nc-booleanControl-switch`}>
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
  classNameWrapper: PropTypes.string.isRequired,
  setActiveStyle: PropTypes.func.isRequired,
  setInactiveStyle: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.bool,
};

BooleanControl.defaultProps = {
  value: false,
};
