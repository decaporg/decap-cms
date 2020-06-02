import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/core';
import { Toggle, ToggleBackground, colors } from 'netlify-cms-ui-default';

const BooleanBackground = ({ isActive, ...props }) => (
  <ToggleBackground
    css={css`
      background-color: ${isActive ? colors.active : colors.textFieldBorder};
    `}
    {...props}
  />
);

export default class BooleanControl extends React.Component {
  handleBlur = () => {
    const { setInactiveStyle, validate } = this.props;
    setInactiveStyle();
    validate();
  };

  render() {
    const { value, forID, onChange, classNameWrapper, setActiveStyle } = this.props;
    return (
      <div className={classNameWrapper}>
        <Toggle
          id={forID}
          active={value}
          onChange={onChange}
          onFocus={setActiveStyle}
          onBlur={this.handleBlur}
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
  validate: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.bool,
};

BooleanControl.defaultProps = {
  value: false,
};
