import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'react-emotion';
import { Toggle, ToggleBackground, colors } from 'netlify-cms-ui-default';

const BooleanBackground = styled(ToggleBackground)`
  background-color: ${props => (props.isActive ? colors.active : colors.textFieldBorder)};
`;

export default class BooleanControl extends React.Component {
  render() {
    const {
      value,
      forID,
      onChange,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
    } = this.props;
    return (
      <div className={classNameWrapper}>
        <Toggle
          id={forID}
          active={value}
          onChange={onChange}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          Background={BooleanBackground}
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
