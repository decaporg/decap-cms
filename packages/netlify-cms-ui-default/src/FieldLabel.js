import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { colors, colorsRaw, transitions } from './styles';

const stateColors = {
  default: {
    background: colors.textFieldBorder,
    text: colors.controlLabel,
  },
  active: {
    background: colors.active,
    text: colors.textLight,
  },
  error: {
    background: colors.errorText,
    text: colorsRaw.white,
  },
};

const getStateColors = ({ isActive, hasErrors }) => {
  return (hasErrors && stateColors.error)
    || (isActive && stateColors.active)
    || stateColors.default;
};

const FieldLabel = styled.label`
  color: ${props => getStateColors(props).text};
  background-color: ${props => getStateColors(props).background};
  display: inline-block;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  border: 0;
  border-radius: 3px 3px 0 0;
  padding: 3px 6px 2px;
  margin: 0;
  transition: all ${transitions.main};
  position: relative;

  /**
   * Faux outside curve into top of input
   */
  &:before,
  &:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    right: -4px;
    height: 100%;
    width: 4px;
    background-color: inherit;
  }

  &:after {
    border-bottom-left-radius: 3px;
    background-color: #fff;
  }
`;

export default FieldLabel;
