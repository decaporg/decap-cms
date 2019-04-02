import css from '@emotion/css';
import {
  withEmotionCache,
  CacheProvider,
  ThemeContext,
  jsx,
  Global,
  keyframes,
  ClassNames,
} from '@emotion/core';
import EmotionStyled from '@emotion/styled';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Lodash from 'lodash/lodash';
import Moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import * as UUId from 'uuid';

const EmotionCore = {
  css,
  withEmotionCache,
  CacheProvider,
  ThemeContext,
  jsx,
  Global,
  keyframes,
  ClassNames,
};
export const NetlifyCmsDefaultExports = {
  EmotionCore,
  EmotionStyled,
  Immutable,
  ImmutablePropTypes,
  Lodash,
  Moment,
  PropTypes,
  React,
  ReactDOM,
  UUId,
};
