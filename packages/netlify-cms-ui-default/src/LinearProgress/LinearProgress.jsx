import React from 'react';
import PropTypes from 'prop-types';
import { css, keyframes } from '@emotion/core';
import styled from '@emotion/styled';

import { TYPE } from '../utils/constants';
import { falseOrDelay } from '../utils/propValidator';

const LinearProgressWrap = styled.div`
  width: 100%;
  height: 3px;
  background-color: ${({ theme }) => theme.color.disabled};
  transform-origin: left;
`;

const countdownAnimation = keyframes`
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
`;

const ProgressIndicator = styled.div`
  background-color: ${({ type, theme }) => {
    if (type === TYPE.SUCCESS) return theme.color.success[900];
    if (type === TYPE.WARNING) return '#FFB81C';
    if (type === TYPE.ERROR) return theme.color.danger[900];
    return theme.color.mediumEmphasis;
  }};
  height: 100%;
  width: ${props => {
    if (props.value) return props.value;
    if (props.countdown) return 100;
    return 0;
  }}%;
  ${props =>
    props.countdown &&
    css`
      transform-origin: left;
      animation: ${countdownAnimation} ${props.countdown}ms linear forwards;
      animation-play-state: ${props => (props.paused ? 'paused' : 'running')};
    `}
`;

const LinearProgress = ({ value, type, countdown, pauseCountdown, onCountdown }) => (
  <LinearProgressWrap>
    <ProgressIndicator
      value={value}
      type={type}
      countdown={countdown}
      paused={pauseCountdown}
      onAnimationEnd={onCountdown && onCountdown}
    />
  </LinearProgressWrap>
);

LinearProgress.propTypes = {
  /**
   * The animation delay which determine when to close the toast
   */
  countdown: falseOrDelay,

  /**
   * Whether or not the animation is running or paused
   */
  pauseCountdown: PropTypes.bool,

  /**
   * Func to when countdown animation completes
   */
  onCountdown: PropTypes.func.isRequired,

  /**
   * Support rtl content
   */
  rtl: PropTypes.bool,

  /**
   * Optional type : info, success ...
   */
  type: PropTypes.string,

  /**
   * Optional className
   */
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),

  /**
   * Progress value (0-100)
   */
  value: PropTypes.number,
};

LinearProgress.defaultProps = {
  type: TYPE.DEFAULT,
};

export default LinearProgress;
