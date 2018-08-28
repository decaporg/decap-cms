import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'react-emotion';
import ReactToggled from 'react-toggled';
import { colors, colorsRaw, shadows, transitions } from './styles';

const ToggleContainer = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 40px;
  height: 20px;
  cursor: pointer;
`;

const ToggleHandle = styled.span`
  ${shadows.dropDeep};
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${colorsRaw.white};
  transition: transform ${transitions.main};

  ${props =>
    props.isActive &&
    css`
      transform: translateX(20px);
    `};
`;

const ToggleBackground = styled.span`
  width: 34px;
  height: 14px;
  border-radius: 10px;
  background-color: ${colors.active};
`;

const Toggle = ({
  active,
  onChange,
  onFocus,
  onBlur,
  className,
  Container = ToggleContainer,
  Background = ToggleBackground,
  Handle = ToggleHandle,
}) => (
  <ReactToggled on={active} onToggle={onChange}>
    {({ on, getElementTogglerProps }) => (
      <Container
        role="switch"
        aria-checked={on.toString()}
        onFocus={onFocus}
        onBlur={onBlur}
        className={className}
        {...getElementTogglerProps()}
      >
        <Background isActive={on} />
        <Handle isActive={on} />
      </Container>
    )}
  </ReactToggled>
);

Toggle.propTypes = {
  active: PropTypes.bool,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  Container: PropTypes.func,
  Background: PropTypes.func,
  Handle: PropTypes.func,
};

const StyledToggle = styled(Toggle)``;

export { StyledToggle as default, ToggleContainer, ToggleBackground, ToggleHandle };
